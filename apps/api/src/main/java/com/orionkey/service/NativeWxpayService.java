package com.orionkey.service;

import java.math.BigDecimal;
import java.util.Map;

public interface NativeWxpayService {

    record NativeWxpayConfig(
            String appId,
            String mchId,
            String apiV3Key,
            String serialNo,
            String privateKeyPath,
            String notifyUrl
    ) {}

    record NativeWxpayResult(String codeUrl) {}

    record H5WxpayResult(String h5Url) {}

    record WxpayCallbackResult(
            String eventId,
            String orderId,
            String transactionId,
            String tradeState,
            long totalAmount,
            String currency,
            String appId,
            String mchId,
            String rawBody
    ) {}

    NativeWxpayResult createNativeOrder(NativeWxpayConfig config, String orderId, BigDecimal amount, String description);

    H5WxpayResult createH5Order(NativeWxpayConfig config, String orderId, BigDecimal amount, String description, String clientIp);

    WxpayCallbackResult parseCallback(NativeWxpayConfig config, String payload, Map<String, String> headers);
}
