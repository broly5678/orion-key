package com.orionkey.service;

import java.math.BigDecimal;

public interface CurrencyRateService {

    String normalizeCurrency(String currency);

    BigDecimal getRateToCny(String currency);

    BigDecimal convert(BigDecimal amount, String sourceCurrency, String targetCurrency);
}
