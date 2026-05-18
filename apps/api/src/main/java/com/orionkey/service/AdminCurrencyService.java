package com.orionkey.service;

import java.util.Map;
import java.util.UUID;

public interface AdminCurrencyService {

    Object listCurrencies();

    void createCurrency(Map<String, Object> request);

    void updateCurrency(UUID id, Map<String, Object> request);

    void deleteCurrency(UUID id);
}
