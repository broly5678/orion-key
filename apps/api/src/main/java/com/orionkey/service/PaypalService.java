package com.orionkey.service;

import java.math.BigDecimal;
import java.util.Map;

public interface PaypalService {

    record PaypalConfig(
            String clientId,
            String clientSecret,
            String webhookId,
            String returnUrl,
            String cancelUrl,
            String currency,
            String environment
    ) {}

    record PaypalOrderResult(
            String paypalOrderId,
            String approveUrl
    ) {}

    record PaypalCaptureResult(
            String paypalOrderId,
            String status,
            BigDecimal amount,
            String currency
    ) {}

    PaypalOrderResult createOrder(PaypalConfig config, String orderId, BigDecimal amount, String productName);

    PaypalCaptureResult captureOrder(PaypalConfig config, String paypalOrderId);

    boolean verifyWebhookSignature(PaypalConfig config, String payload, Map<String, String> headers);
}
