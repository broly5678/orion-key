package com.orionkey.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionkey.constant.ErrorCode;
import com.orionkey.exception.BusinessException;
import com.orionkey.service.StripeService;
import com.orionkey.util.PaymentCurrencyUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class StripeServiceImpl implements StripeService {

    private static final String STRIPE_API_BASE = "https://api.stripe.com/v1";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public StripeCheckoutResult createCheckoutSession(StripeConfig config, String orderId, BigDecimal amount, String productName) {
        long minorUnitAmount = PaymentCurrencyUtils.toStripeMinorUnit(amount, config.currency());
        if (minorUnitAmount <= 0) {
            throw new BusinessException(ErrorCode.CHANNEL_UNAVAILABLE, "Stripe 支付金额必须大于 0");
        }

        String successUrl = appendOrderId(config.successUrl(), orderId);
        String cancelUrl = appendOrderId(config.cancelUrl(), orderId);

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("mode", "payment");
        formData.add("success_url", successUrl);
        formData.add("cancel_url", cancelUrl);
        formData.add("client_reference_id", orderId);
        formData.add("payment_method_types[0]", "card");
        formData.add("line_items[0][quantity]", "1");
        formData.add("line_items[0][price_data][currency]", config.currency().toLowerCase());
        formData.add("line_items[0][price_data][unit_amount]", String.valueOf(minorUnitAmount));
        formData.add("line_items[0][price_data][product_data][name]", productName);
        formData.add("metadata[order_id]", orderId);
        formData.add("payment_intent_data[metadata][order_id]", orderId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setBearerAuth(config.secretKey());

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(formData, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    STRIPE_API_BASE + "/checkout/sessions",
                    request,
                    String.class
            );
            String body = response.getBody();
            if (body == null || body.isBlank()) {
                throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL, "Stripe 创建支付会话失败：响应为空");
            }

            Map<String, Object> result = objectMapper.readValue(body, new TypeReference<>() {});
            String sessionId = stringValue(result.get("id"));
            String checkoutUrl = stringValue(result.get("url"));
            if (sessionId == null || checkoutUrl == null) {
                throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL, "Stripe 创建支付会话失败：响应不完整");
            }

            return new StripeCheckoutResult(sessionId, checkoutUrl);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Stripe createCheckoutSession failed: orderId={}, error={}", orderId, e.getMessage(), e);
            throw new BusinessException(ErrorCode.WEBHOOK_VERIFY_FAIL, "Stripe 创建支付会话失败，请检查后台配置");
        }
    }

    @Override
    public boolean verifyWebhookSignature(String webhookSecret, String payload, String signatureHeader) {
        if (webhookSecret == null || webhookSecret.isBlank() || payload == null || signatureHeader == null || signatureHeader.isBlank()) {
            return false;
        }

        String timestamp = null;
        List<String> signatures = new java.util.ArrayList<>();
        for (String part : signatureHeader.split(",")) {
            String[] kv = part.split("=", 2);
            if (kv.length != 2) continue;
            if ("t".equals(kv[0])) timestamp = kv[1];
            if ("v1".equals(kv[0])) signatures.add(kv[1]);
        }
        if (timestamp == null || signatures.isEmpty()) {
            return false;
        }

        String signedPayload = timestamp + "." + payload;
        String expected = hmacSha256(webhookSecret, signedPayload);
        return signatures.stream().anyMatch(sig -> constantTimeEquals(sig, expected));
    }

    private static String appendOrderId(String baseUrl, String orderId) {
        return baseUrl + (baseUrl.contains("?") ? "&" : "?") + "orderId=" + orderId;
    }

    private static String stringValue(Object value) {
        return value != null ? value.toString() : null;
    }

    private static String hmacSha256(String secret, String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] bytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to sign Stripe payload", e);
        }
    }

    private static boolean constantTimeEquals(String left, String right) {
        byte[] a = left.getBytes(StandardCharsets.UTF_8);
        byte[] b = right.getBytes(StandardCharsets.UTF_8);
        if (a.length != b.length) return false;
        int result = 0;
        for (int i = 0; i < a.length; i++) {
            result |= a[i] ^ b[i];
        }
        return result == 0;
    }
}
