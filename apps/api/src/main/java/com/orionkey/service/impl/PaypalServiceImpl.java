package com.orionkey.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionkey.constant.ErrorCode;
import com.orionkey.exception.BusinessException;
import com.orionkey.service.PaypalService;
import com.orionkey.util.PaymentCurrencyUtils;
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
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaypalServiceImpl implements PaypalService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public PaypalOrderResult createOrder(PaypalConfig config, String orderId, BigDecimal amount, String productName) {
        String accessToken = getAccessToken(config);
        String baseUrl = getApiBase(config.environment());

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("intent", "CAPTURE");

        Map<String, Object> amountData = new LinkedHashMap<>();
        String currency = PaymentCurrencyUtils.normalizeCurrency(config.currency());
        amountData.put("currency_code", currency);
        amountData.put("value", PaymentCurrencyUtils.scaleForCurrency(amount, currency).toPlainString());

        Map<String, Object> purchaseUnit = new LinkedHashMap<>();
        purchaseUnit.put("reference_id", orderId);
        purchaseUnit.put("custom_id", orderId);
        purchaseUnit.put("invoice_id", orderId);
        purchaseUnit.put("description", productName);
        purchaseUnit.put("amount", amountData);
        payload.put("purchase_units", List.of(purchaseUnit));

        Map<String, Object> experienceContext = new LinkedHashMap<>();
        experienceContext.put("payment_method_preference", "IMMEDIATE_PAYMENT_REQUIRED");
        experienceContext.put("user_action", "PAY_NOW");
        experienceContext.put("return_url", appendOrderId(config.returnUrl(), orderId));
        experienceContext.put("cancel_url", appendOrderId(config.cancelUrl(), orderId));

        Map<String, Object> paypal = new LinkedHashMap<>();
        paypal.put("experience_context", experienceContext);

        Map<String, Object> paymentSource = new LinkedHashMap<>();
        paymentSource.put("paypal", paypal);
        payload.put("payment_source", paymentSource);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    baseUrl + "/v2/checkout/orders",
                    request,
                    String.class
            );
            String body = response.getBody();
            if (body == null || body.isBlank()) {
                throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL, "PayPal 创建订单失败：响应为空");
            }

            Map<String, Object> result = objectMapper.readValue(body, new TypeReference<>() {});
            String paypalOrderId = stringValue(result.get("id"));
            String approveUrl = findPaypalApproveUrl(result.get("links"));
            if (paypalOrderId == null || approveUrl == null) {
                throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL, "PayPal 创建订单失败：缺少跳转地址");
            }
            return new PaypalOrderResult(paypalOrderId, approveUrl);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("PayPal createOrder failed: orderId={}, error={}", orderId, e.getMessage(), e);
            throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL, "PayPal 创建订单失败，请检查后台配置");
        }
    }

    @Override
    public PaypalCaptureResult captureOrder(PaypalConfig config, String paypalOrderId) {
        String accessToken = getAccessToken(config);
        String baseUrl = getApiBase(config.environment());

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        HttpEntity<String> request = new HttpEntity<>("{}", headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    baseUrl + "/v2/checkout/orders/" + paypalOrderId + "/capture",
                    request,
                    String.class
            );
            String body = response.getBody();
            if (body == null || body.isBlank()) {
                throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL, "PayPal 捕获订单失败：响应为空");
            }
            Map<String, Object> result = objectMapper.readValue(body, new TypeReference<>() {});
            String status = stringValue(result.get("status"));
            String id = stringValue(result.get("id"));
            Map<String, Object> purchaseUnit = firstMap(result.get("purchase_units"));
            Map<String, Object> payments = asMap(purchaseUnit.get("payments"));
            Map<String, Object> capture = firstMap(payments.get("captures"));
            Map<String, Object> amount = asMap(capture.get("amount"));
            BigDecimal capturedAmount = parseAmount(stringValue(amount.get("value")));
            String capturedCurrency = stringValue(amount.get("currency_code"));
            return new PaypalCaptureResult(
                    id != null ? id : paypalOrderId,
                    status != null ? status : "UNKNOWN",
                    capturedAmount,
                    capturedCurrency
            );
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("PayPal captureOrder failed: paypalOrderId={}, error={}", paypalOrderId, e.getMessage(), e);
            throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL, "PayPal 捕获订单失败");
        }
    }

    @Override
    public boolean verifyWebhookSignature(PaypalConfig config, String payload, Map<String, String> headers) {
        try {
            String accessToken = getAccessToken(config);
            String baseUrl = getApiBase(config.environment());

            Map<String, Object> webhookEvent = objectMapper.readValue(payload, new TypeReference<>() {});
            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("auth_algo", firstHeader(headers, "paypal-auth-algo"));
            requestBody.put("cert_url", firstHeader(headers, "paypal-cert-url"));
            requestBody.put("transmission_id", firstHeader(headers, "paypal-transmission-id"));
            requestBody.put("transmission_sig", firstHeader(headers, "paypal-transmission-sig"));
            requestBody.put("transmission_time", firstHeader(headers, "paypal-transmission-time"));
            requestBody.put("webhook_id", config.webhookId());
            requestBody.put("webhook_event", webhookEvent);

            HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setBearerAuth(accessToken);
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);
            httpHeaders.setAccept(List.of(MediaType.APPLICATION_JSON));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, httpHeaders);
            ResponseEntity<String> response = restTemplate.postForEntity(
                    baseUrl + "/v1/notifications/verify-webhook-signature",
                    request,
                    String.class
            );

            String body = response.getBody();
            if (body == null || body.isBlank()) return false;
            Map<String, Object> result = objectMapper.readValue(body, new TypeReference<>() {});
            return "SUCCESS".equalsIgnoreCase(stringValue(result.get("verification_status")));
        } catch (Exception e) {
            log.error("PayPal webhook signature verification failed: {}", e.getMessage(), e);
            return false;
        }
    }

    private String getAccessToken(PaypalConfig config) {
        String baseUrl = getApiBase(config.environment());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        String basicAuth = Base64.getEncoder()
                .encodeToString((config.clientId() + ":" + config.clientSecret()).getBytes(StandardCharsets.UTF_8));
        headers.set(HttpHeaders.AUTHORIZATION, "Basic " + basicAuth);

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "client_credentials");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(formData, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    baseUrl + "/v1/oauth2/token",
                    request,
                    String.class
            );
            String body = response.getBody();
            if (body == null || body.isBlank()) {
                throw new BusinessException(ErrorCode.CHANNEL_UNAVAILABLE, "PayPal 获取 access token 失败：响应为空");
            }
            Map<String, Object> result = objectMapper.readValue(body, new TypeReference<>() {});
            String accessToken = stringValue(result.get("access_token"));
            if (accessToken == null || accessToken.isBlank()) {
                throw new BusinessException(ErrorCode.CHANNEL_UNAVAILABLE, "PayPal 获取 access token 失败");
            }
            return accessToken;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("PayPal getAccessToken failed: {}", e.getMessage(), e);
            throw new BusinessException(ErrorCode.CHANNEL_UNAVAILABLE, "PayPal 认证失败，请检查 Client ID / Secret");
        }
    }

    private String findPaypalApproveUrl(Object linksObject) {
        if (!(linksObject instanceof List<?> links)) return null;
        for (Object item : links) {
            if (!(item instanceof Map<?, ?> raw)) continue;
            Object rel = raw.get("rel");
            if ("approve".equals(rel) || "payer-action".equals(rel)) {
                Object href = raw.get("href");
                return href != null ? href.toString() : null;
            }
        }
        return null;
    }

    private String getApiBase(String environment) {
        return "sandbox".equalsIgnoreCase(environment)
                ? "https://api-m.sandbox.paypal.com"
                : "https://api-m.paypal.com";
    }

    private String appendOrderId(String baseUrl, String orderId) {
        return baseUrl + (baseUrl.contains("?") ? "&" : "?") + "orderId=" + orderId;
    }

    private String firstHeader(Map<String, String> headers, String name) {
        for (Map.Entry<String, String> entry : headers.entrySet()) {
            if (entry.getKey() != null && entry.getKey().equalsIgnoreCase(name)) {
                return entry.getValue();
            }
        }
        return null;
    }

    private String stringValue(Object value) {
        return value != null ? value.toString() : null;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        return value instanceof Map<?, ?> raw ? (Map<String, Object>) raw : Map.of();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> firstMap(Object value) {
        if (!(value instanceof List<?> list) || list.isEmpty() || !(list.getFirst() instanceof Map<?, ?> raw)) {
            return Map.of();
        }
        return (Map<String, Object>) raw;
    }

    private BigDecimal parseAmount(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return new BigDecimal(value);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}
