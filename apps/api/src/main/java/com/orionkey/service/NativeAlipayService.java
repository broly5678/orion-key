package com.orionkey.service;

import java.math.BigDecimal;
import java.util.Map;

public interface NativeAlipayService {

    record NativeAlipayConfig(
            String appId,
            String privateKey,
            String alipayPublicKey,
            String gatewayUrl,
            String notifyUrl,
            String returnUrl
    ) {}

    record NativeAlipayPrecreateResult(String qrCode) {}

    NativeAlipayPrecreateResult createPrecreateOrder(NativeAlipayConfig config, String orderId, BigDecimal amount, String productName);

    String buildWapPayForm(NativeAlipayConfig config, String orderId, BigDecimal amount, String productName);

    boolean verifyCallback(NativeAlipayConfig config, Map<String, String> params);
}
