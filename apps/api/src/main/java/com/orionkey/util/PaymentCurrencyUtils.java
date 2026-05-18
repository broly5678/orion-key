package com.orionkey.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

public final class PaymentCurrencyUtils {

    private static final Map<String, BigDecimal> CURRENCY_TO_CNY = Map.of(
            "CNY", BigDecimal.ONE,
            "USD", new BigDecimal("7.2"),
            "EUR", new BigDecimal("7.8"),
            "JPY", new BigDecimal("0.05"),
            "KRW", new BigDecimal("0.0052"),
            "GBP", new BigDecimal("9.1"),
            "USDT", new BigDecimal("7.2")
    );

    private static final Set<String> ZERO_DECIMAL_CURRENCIES = Set.of("JPY", "KRW");
    private static final Set<String> LOCAL_CNY_METHODS = Set.of("alipay", "wechat", "wxpay");
    private static final Set<String> GLOBAL_METHODS = Set.of("stripe", "paypal");

    private PaymentCurrencyUtils() {}

    public static String normalizeLocale(String locale) {
        if (locale == null || locale.isBlank()) return "en";
        String normalized = locale.trim().toLowerCase(Locale.ROOT).replace('_', '-');
        int dashIndex = normalized.indexOf('-');
        return dashIndex > 0 ? normalized.substring(0, dashIndex) : normalized;
    }

    public static String normalizeCurrency(String currency) {
        if (currency == null || currency.isBlank()) return "CNY";
        String upper = currency.trim().toUpperCase(Locale.ROOT);
        return CURRENCY_TO_CNY.containsKey(upper) ? upper : "CNY";
    }

    public static String resolvePreferredCurrency(String locale) {
        return switch (normalizeLocale(locale)) {
            case "zh" -> "CNY";
            case "ja" -> "JPY";
            case "ko" -> "KRW";
            case "es", "fr", "de" -> "EUR";
            default -> "USD";
        };
    }

    public static String resolveSettlementCurrency(String paymentMethod, String locale, String fallbackCurrency) {
        String normalizedMethod = paymentMethod == null ? "" : paymentMethod.trim().toLowerCase(Locale.ROOT);
        if (normalizedMethod.startsWith("usdt_")) {
            return resolvePreferredCurrency(locale);
        }
        if (GLOBAL_METHODS.contains(normalizedMethod)) {
            return resolvePreferredCurrency(locale);
        }
        if (LOCAL_CNY_METHODS.contains(normalizedMethod)) {
            return "CNY";
        }
        return normalizeCurrency(fallbackCurrency);
    }

    public static BigDecimal convert(BigDecimal amount, String sourceCurrency, String targetCurrency) {
        if (amount == null) return BigDecimal.ZERO;
        String source = normalizeCurrency(sourceCurrency);
        String target = normalizeCurrency(targetCurrency);
        if (source.equals(target)) {
            return scaleForCurrency(amount, target);
        }
        BigDecimal sourceRate = CURRENCY_TO_CNY.getOrDefault(source, BigDecimal.ONE);
        BigDecimal targetRate = CURRENCY_TO_CNY.getOrDefault(target, BigDecimal.ONE);
        BigDecimal amountInCny = amount.multiply(sourceRate);
        BigDecimal converted = amountInCny.divide(targetRate, 8, RoundingMode.HALF_UP);
        return scaleForCurrency(converted, target);
    }

    public static BigDecimal scaleForCurrency(BigDecimal amount, String currency) {
        int scale = isZeroDecimalCurrency(currency) ? 0 : 2;
        return amount.setScale(scale, RoundingMode.HALF_UP);
    }

    public static long toStripeMinorUnit(BigDecimal amount, String currency) {
        BigDecimal normalized = scaleForCurrency(amount, currency);
        BigDecimal minorUnit = isZeroDecimalCurrency(currency)
                ? normalized
                : normalized.multiply(BigDecimal.valueOf(100));
        return minorUnit.setScale(0, RoundingMode.HALF_UP).longValueExact();
    }

    public static boolean isZeroDecimalCurrency(String currency) {
        return ZERO_DECIMAL_CURRENCIES.contains(normalizeCurrency(currency));
    }
}
