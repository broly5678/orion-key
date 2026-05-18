package com.orionkey.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionkey.constant.ErrorCode;
import com.orionkey.exception.BusinessException;
import com.orionkey.service.NativeWxpayService;
import com.orionkey.util.PaymentCryptoUtils;
import com.orionkey.util.PaymentCurrencyUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class NativeWxpayServiceImpl implements NativeWxpayService {

    private static final String WX_API_BASE = "https://api.mch.weixin.qq.com";
    private static final long CERT_CACHE_TTL_MS = TimeUnit.HOURS.toMillis(12);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private final Map<String, CachedPlatformKey> platformKeyCache = new ConcurrentHashMap<>();

    @Override
    public NativeWxpayResult createNativeOrder(NativeWxpayConfig config, String orderId, BigDecimal amount, String description) {
        Map<String, Object> payload = buildBasePayload(config, orderId, amount, description);
        String response = postJson(config, "/v3/pay/transactions/native", payload);
        try {
            Map<String, Object> result = objectMapper.readValue(response, new TypeReference<>() {});
            String codeUrl = stringValue(result.get("code_url"));
            if (codeUrl == null || codeUrl.isBlank()) {
                throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL, "微信 Native 下单失败：未返回 code_url");
            }
            return new NativeWxpayResult(codeUrl);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Native WeChat create native order failed: orderId={}, error={}", orderId, e.getMessage(), e);
            throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL, "原生微信 Native 下单失败");
        }
    }

    @Override
    public H5WxpayResult createH5Order(NativeWxpayConfig config, String orderId, BigDecimal amount, String description, String clientIp) {
        Map<String, Object> payload = buildBasePayload(config, orderId, amount, description);
        Map<String, Object> sceneInfo = new LinkedHashMap<>();
        sceneInfo.put("payer_client_ip", clientIp == null || clientIp.isBlank() ? "127.0.0.1" : clientIp);
        sceneInfo.put("h5_info", Map.of("type", "Wap"));
        payload.put("scene_info", sceneInfo);

        String response = postJson(config, "/v3/pay/transactions/h5", payload);
        try {
            Map<String, Object> result = objectMapper.readValue(response, new TypeReference<>() {});
            String h5Url = stringValue(result.get("h5_url"));
            if (h5Url == null || h5Url.isBlank()) {
                throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL, "微信 H5 下单失败：未返回 h5_url");
            }
            return new H5WxpayResult(h5Url);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Native WeChat create h5 order failed: orderId={}, error={}", orderId, e.getMessage(), e);
            throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL, "原生微信 H5 下单失败");
        }
    }

    @Override
    public WxpayCallbackResult parseCallback(NativeWxpayConfig config, String payload, Map<String, String> headers) {
        String serial = firstHeader(headers, "Wechatpay-Serial");
        String signature = firstHeader(headers, "Wechatpay-Signature");
        String timestamp = firstHeader(headers, "Wechatpay-Timestamp");
        String nonce = firstHeader(headers, "Wechatpay-Nonce");
        if (serial == null || signature == null || timestamp == null || nonce == null) {
            throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL, "微信回调请求头不完整");
        }

        PublicKey platformKey = getPlatformKey(config, serial);
        String message = timestamp + "\n" + nonce + "\n" + payload + "\n";
        if (!PaymentCryptoUtils.verifySha256Rsa(message, signature, platformKey)) {
            throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL, "微信回调签名校验失败");
        }

        try {
            Map<String, Object> body = objectMapper.readValue(payload, new TypeReference<>() {});
            String eventId = stringValue(body.get("id"));
            Map<String, Object> resource = asMap(body.get("resource"));
            String plainText = PaymentCryptoUtils.decryptAesGcm(
                    config.apiV3Key(),
                    stringValue(resource.get("associated_data")),
                    stringValue(resource.get("nonce")),
                    stringValue(resource.get("ciphertext"))
            );

            Map<String, Object> data = objectMapper.readValue(plainText, new TypeReference<>() {});
            Map<String, Object> amount = asMap(data.get("amount"));
            return new WxpayCallbackResult(
                    eventId != null ? eventId : stringValue(data.get("transaction_id")),
                    stringValue(data.get("out_trade_no")),
                    stringValue(data.get("transaction_id")),
                    stringValue(data.get("trade_state")),
                    longValue(amount.get("total")),
                    stringValue(amount.get("currency")),
                    stringValue(data.get("appid")),
                    stringValue(data.get("mchid")),
                    plainText
            );
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL, "微信回调解密失败");
        }
    }

    private Map<String, Object> buildBasePayload(NativeWxpayConfig config, String orderId, BigDecimal amount, String description) {
        String currency = PaymentCurrencyUtils.normalizeCurrency("CNY");
        long fen = PaymentCurrencyUtils.toStripeMinorUnit(amount, currency);
        if (fen <= 0) {
            throw new BusinessException(ErrorCode.CHANNEL_UNAVAILABLE, "微信支付金额必须大于 0");
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("appid", config.appId());
        payload.put("mchid", config.mchId());
        payload.put("description", description);
        payload.put("out_trade_no", orderId);
        payload.put("notify_url", config.notifyUrl());
        payload.put("amount", Map.of(
                "total", fen,
                "currency", currency
        ));
        return payload;
    }

    private String postJson(NativeWxpayConfig config, String path, Map<String, Object> payload) {
        try {
            String body = objectMapper.writeValueAsString(payload);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));
            headers.set("Authorization", buildAuthorization(config, "POST", path, body));

            ResponseEntity<String> response = restTemplate.exchange(
                    URI.create(WX_API_BASE + path),
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    String.class
            );
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null || response.getBody().isBlank()) {
                throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL, "微信支付下单失败：响应为空");
            }
            return response.getBody();
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("WeChat Pay request failed: path={}, error={}", path, e.getMessage(), e);
            throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL, "微信支付请求失败，请检查商户配置");
        }
    }

    private PublicKey getPlatformKey(NativeWxpayConfig config, String serial) {
        CachedPlatformKey cached = platformKeyCache.get(serial);
        if (cached != null && !cached.isExpired()) {
            return cached.publicKey();
        }

        refreshPlatformCertificates(config);
        cached = platformKeyCache.get(serial);
        if (cached == null) {
            throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL, "未找到微信平台证书: " + serial);
        }
        return cached.publicKey();
    }

    private void refreshPlatformCertificates(NativeWxpayConfig config) {
        String path = "/v3/certificates";
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));
            headers.set("Authorization", buildAuthorization(config, "GET", path, ""));

            ResponseEntity<String> response = restTemplate.exchange(
                    URI.create(WX_API_BASE + path),
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    String.class
            );
            String body = response.getBody();
            if (body == null || body.isBlank()) {
                throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL, "微信平台证书列表为空");
            }
            Map<String, Object> result = objectMapper.readValue(body, new TypeReference<>() {});
            Object dataObject = result.get("data");
            if (!(dataObject instanceof java.util.List<?> dataList)) {
                throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL, "微信平台证书列表格式错误");
            }
            for (Object item : dataList) {
                if (!(item instanceof Map<?, ?> raw)) continue;
                String serialNo = stringValue(raw.get("serial_no"));
                Map<String, Object> encryptCertificate = asMap(raw.get("encrypt_certificate"));
                String certificatePem = PaymentCryptoUtils.decryptAesGcm(
                        config.apiV3Key(),
                        stringValue(encryptCertificate.get("associated_data")),
                        stringValue(encryptCertificate.get("nonce")),
                        stringValue(encryptCertificate.get("ciphertext"))
                );
                platformKeyCache.put(serialNo, new CachedPlatformKey(
                        PaymentCryptoUtils.loadPublicKey(certificatePem),
                        System.currentTimeMillis() + CERT_CACHE_TTL_MS
                ));
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Refresh WeChat platform certificates failed: {}", e.getMessage(), e);
            throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL, "拉取微信平台证书失败");
        }
    }

    private String buildAuthorization(NativeWxpayConfig config, String method, String path, String body) {
        String nonce = UUID.randomUUID().toString().replace("-", "");
        long timestamp = Instant.now().getEpochSecond();
        String message = method + "\n" + path + "\n" + timestamp + "\n" + nonce + "\n" + body + "\n";
        PrivateKey privateKey = PaymentCryptoUtils.loadPrivateKeyFromPath(config.privateKeyPath());
        String signature = PaymentCryptoUtils.signSha256Rsa(message, privateKey);
        return "WECHATPAY2-SHA256-RSA2048 "
                + "mchid=\"" + config.mchId() + "\","
                + "nonce_str=\"" + nonce + "\","
                + "signature=\"" + signature + "\","
                + "timestamp=\"" + timestamp + "\","
                + "serial_no=\"" + config.serialNo() + "\"";
    }

    private String firstHeader(Map<String, String> headers, String name) {
        for (Map.Entry<String, String> entry : headers.entrySet()) {
            if (entry.getKey() != null && entry.getKey().equalsIgnoreCase(name)) {
                return entry.getValue();
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        return value instanceof Map<?, ?> map ? (Map<String, Object>) map : Map.of();
    }

    private String stringValue(Object value) {
        return value != null ? value.toString() : null;
    }

    private long longValue(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value == null) return 0L;
        return Long.parseLong(value.toString());
    }

    private record CachedPlatformKey(PublicKey publicKey, long expiresAt) {
        private boolean isExpired() {
            return System.currentTimeMillis() >= expiresAt;
        }
    }
}
