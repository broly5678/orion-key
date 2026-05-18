package com.orionkey.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionkey.constant.ErrorCode;
import com.orionkey.exception.BusinessException;
import com.orionkey.service.NativeAlipayService;
import com.orionkey.util.PaymentCryptoUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.TreeMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class NativeAlipayServiceImpl implements NativeAlipayService {

    private static final DateTimeFormatter ALIPAY_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public NativeAlipayPrecreateResult createPrecreateOrder(NativeAlipayConfig config, String orderId, BigDecimal amount, String productName) {
        Map<String, String> bizContent = new LinkedHashMap<>();
        bizContent.put("out_trade_no", orderId);
        bizContent.put("total_amount", amount.setScale(2, RoundingMode.HALF_UP).toPlainString());
        bizContent.put("subject", truncate(productName, 256));
        bizContent.put("timeout_express", "15m");

        Map<String, String> params = buildSignedParams(config, "alipay.trade.precreate", bizContent);
        String requestUrl = buildGatewayUrl(config.gatewayUrl(), params.get("charset"));
        MultiValueMap<String, String> formData = buildFormData(params);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            ResponseEntity<String> response = restTemplate.postForEntity(
                    requestUrl,
                    new HttpEntity<>(formData, headers),
                    String.class
            );
            String body = response.getBody();
            if (body == null || body.isBlank()) {
                throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL, "支付宝预下单失败：响应为空");
            }
            Map<String, Object> result = objectMapper.readValue(body, new TypeReference<>() {});
            Map<String, Object> data = asMap(result.get("alipay_trade_precreate_response"));
            String code = stringValue(data.get("code"));
            if (!"10000".equals(code)) {
                throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL,
                        "支付宝预下单失败: " + stringValue(data.getOrDefault("sub_msg", data.get("msg"))));
            }
            String qrCode = stringValue(data.get("qr_code"));
            if (qrCode == null || qrCode.isBlank()) {
                throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL, "支付宝预下单失败：未返回二维码");
            }
            return new NativeAlipayPrecreateResult(qrCode);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Native Alipay precreate failed: orderId={}, error={}", orderId, e.getMessage(), e);
            throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL, "原生支付宝预下单失败，请检查后台配置");
        }
    }

    @Override
    public String buildWapPayForm(NativeAlipayConfig config, String orderId, BigDecimal amount, String productName) {
        Map<String, String> bizContent = new LinkedHashMap<>();
        bizContent.put("out_trade_no", orderId);
        bizContent.put("total_amount", amount.setScale(2, RoundingMode.HALF_UP).toPlainString());
        bizContent.put("subject", truncate(productName, 256));
        bizContent.put("product_code", "QUICK_WAP_WAY");
        bizContent.put("quit_url", config.returnUrl());
        bizContent.put("timeout_express", "15m");

        Map<String, String> params = buildSignedParams(config, "alipay.trade.wap.pay", bizContent);
        String actionUrl = buildGatewayUrl(config.gatewayUrl(), params.get("charset"));
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><title>Redirecting...</title></head><body>");
        html.append("<form id=\"alipaySubmit\" name=\"alipaySubmit\" action=\"")
                .append(escapeHtml(actionUrl))
                .append("\" method=\"POST\">");
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if ("charset".equals(entry.getKey())) continue;
            html.append("<input type=\"hidden\" name=\"")
                    .append(escapeHtml(entry.getKey()))
                    .append("\" value=\"")
                    .append(escapeHtml(entry.getValue()))
                    .append("\"/>");
        }
        html.append("</form><script>document.forms['alipaySubmit'].submit();</script></body></html>");
        return html.toString();
    }

    @Override
    public boolean verifyCallback(NativeAlipayConfig config, Map<String, String> params) {
        String sign = params.get("sign");
        if (sign == null || sign.isBlank()) return false;

        Map<String, String> filtered = new TreeMap<>();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (value == null || value.isBlank() || "sign".equals(key) || "sign_type".equals(key)) continue;
            filtered.put(key, value);
        }

        PublicKey publicKey = PaymentCryptoUtils.loadPublicKey(config.alipayPublicKey());
        return PaymentCryptoUtils.verifySha256Rsa(buildSignContent(filtered), sign, publicKey);
    }

    private Map<String, String> buildSignedParams(NativeAlipayConfig config, String method, Map<String, String> bizContent) {
        Map<String, String> params = new TreeMap<>();
        params.put("app_id", config.appId());
        params.put("method", method);
        params.put("format", "JSON");
        params.put("charset", "UTF-8");
        params.put("sign_type", "RSA2");
        params.put("timestamp", ALIPAY_TIME.format(LocalDateTime.now()));
        params.put("version", "1.0");
        params.put("notify_url", config.notifyUrl());
        if (config.returnUrl() != null && !config.returnUrl().isBlank()) {
            params.put("return_url", config.returnUrl());
        }
        params.put("biz_content", toJson(bizContent));

        PrivateKey privateKey = PaymentCryptoUtils.loadPrivateKey(config.privateKey());
        params.put("sign", PaymentCryptoUtils.signSha256Rsa(buildSignContent(params), privateKey));
        return params;
    }

    private String toJson(Map<String, String> value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException("构建支付宝请求失败", e);
        }
    }

    private String buildSignContent(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if ("sign".equals(entry.getKey())) continue;
            if (!first) sb.append("&");
            sb.append(entry.getKey()).append("=").append(entry.getValue());
            first = false;
        }
        return sb.toString();
    }

    private String buildGatewayUrl(String gatewayUrl, String charset) {
        StringBuilder sb = new StringBuilder(gatewayUrl);
        sb.append(gatewayUrl.contains("?") ? "&" : "?")
                .append("charset=")
                .append(rfc3986Encode(charset));
        return sb.toString();
    }

    private MultiValueMap<String, String> buildFormData(Map<String, String> params) {
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if ("charset".equals(entry.getKey())) continue;
            formData.add(entry.getKey(), entry.getValue());
        }
        return formData;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        return value instanceof Map<?, ?> map ? (Map<String, Object>) map : Map.of();
    }

    private String stringValue(Object value) {
        return value != null ? value.toString() : null;
    }

    private String truncate(String value, int maxLength) {
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private String escapeHtml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("\"", "&quot;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }

    private String escapeJs(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\r", "\\r")
                .replace("\n", "\\n");
    }

    private String rfc3986Encode(String value) {
        byte[] bytes = value.getBytes(StandardCharsets.UTF_8);
        StringBuilder sb = new StringBuilder(bytes.length * 3);
        for (byte b : bytes) {
            int c = b & 0xFF;
            if ((c >= 'A' && c <= 'Z')
                    || (c >= 'a' && c <= 'z')
                    || (c >= '0' && c <= '9')
                    || c == '-'
                    || c == '_'
                    || c == '.'
                    || c == '~') {
                sb.append((char) c);
            } else {
                sb.append('%');
                sb.append(Character.toUpperCase(Character.forDigit((c >> 4) & 0xF, 16)));
                sb.append(Character.toUpperCase(Character.forDigit(c & 0xF, 16)));
            }
        }
        return sb.toString();
    }
}
