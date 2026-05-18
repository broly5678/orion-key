package com.orionkey.service;

import java.util.Map;

public interface WebhookService {

    /**
     * 处理易支付 GET 回调
     */
    String processEpayCallback(Map<String, String> params);

    /**
     * 处理 BEpusdt USDT 支付回调（JSON body，含非 String 类型字段如 amount/status）
     */
    String processBepusdtCallback(Map<String, Object> params);

    /**
     * 处理 Stripe Checkout Webhook 回调
     */
    String processStripeCallback(String payload, String signatureHeader);

    /**
     * 处理原生支付宝异步回调
     */
    String processNativeAlipayCallback(Map<String, String> params);

    /**
     * 处理原生微信支付异步回调
     */
    String processNativeWxpayCallback(String payload, Map<String, String> headers);

    /**
     * 处理 PayPal Webhook 回调
     */
    String processPaypalCallback(String payload, Map<String, String> headers);
}
