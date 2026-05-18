package com.orionkey.service.impl;

import com.orionkey.repository.CurrencyRepository;
import com.orionkey.service.CurrencyRateService;
import com.orionkey.util.PaymentCurrencyUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CurrencyRateServiceImpl implements CurrencyRateService {

    private static final Map<String, BigDecimal> DEFAULT_RATES = Map.of(
            "CNY", BigDecimal.ONE,
            "USD", new BigDecimal("7.2"),
            "EUR", new BigDecimal("7.8"),
            "JPY", new BigDecimal("0.05"),
            "KRW", new BigDecimal("0.0052"),
            "GBP", new BigDecimal("9.1"),
            "USDT", new BigDecimal("7.2")
    );

    private final CurrencyRepository currencyRepository;

    @Override
    public String normalizeCurrency(String currency) {
        if (currency == null || currency.isBlank()) return "CNY";
        return currency.trim().toUpperCase(Locale.ROOT);
    }

    @Override
    public BigDecimal getRateToCny(String currency) {
        String code = normalizeCurrency(currency);
        return currencyRepository.findByCodeIgnoreCase(code)
                .map(c -> c.getRateToCny() != null && c.getRateToCny().compareTo(BigDecimal.ZERO) > 0
                        ? c.getRateToCny()
                        : DEFAULT_RATES.getOrDefault(code, BigDecimal.ONE))
                .orElse(DEFAULT_RATES.getOrDefault(code, BigDecimal.ONE));
    }

    @Override
    public BigDecimal convert(BigDecimal amount, String sourceCurrency, String targetCurrency) {
        if (amount == null) return BigDecimal.ZERO;
        String source = normalizeCurrency(sourceCurrency);
        String target = normalizeCurrency(targetCurrency);
        if (source.equals(target)) {
            return PaymentCurrencyUtils.scaleForCurrency(amount, target);
        }
        BigDecimal amountInCny = amount.multiply(getRateToCny(source));
        BigDecimal converted = amountInCny.divide(getRateToCny(target), 8, RoundingMode.HALF_UP);
        return PaymentCurrencyUtils.scaleForCurrency(converted, target);
    }
}
