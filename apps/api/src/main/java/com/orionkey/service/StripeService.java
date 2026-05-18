package com.orionkey.service;

import java.math.BigDecimal;

public interface StripeService {

    record StripeConfig(
            String secretKey,
            String webhookSecret,
            String successUrl,
            String cancelUrl,
            String currency
    ) {}

    record StripeCheckoutResult(
            String sessionId,
            String checkoutUrl
    ) {}

    StripeCheckoutResult createCheckoutSession(StripeConfig config, String orderId, BigDecimal amount, String productName);

    boolean verifyWebhookSignature(String webhookSecret, String payload, String signatureHeader);
}
