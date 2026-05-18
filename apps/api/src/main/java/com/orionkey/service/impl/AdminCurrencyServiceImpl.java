package com.orionkey.service.impl;

import com.orionkey.constant.ErrorCode;
import com.orionkey.entity.Currency;
import com.orionkey.exception.BusinessException;
import com.orionkey.repository.CurrencyRepository;
import com.orionkey.service.AdminCurrencyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminCurrencyServiceImpl implements AdminCurrencyService {

    private final CurrencyRepository currencyRepository;

    @Override
    public Object listCurrencies() {
        return currencyRepository.findAll().stream()
                .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                .map(this::toMap)
                .toList();
    }

    @Override
    @Transactional
    public void createCurrency(Map<String, Object> request) {
        String code = requiredString(request, "code").toUpperCase(Locale.ROOT);
        if (currencyRepository.findByCodeIgnoreCase(code).isPresent()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "货币代码已存在");
        }
        Currency currency = new Currency();
        currency.setCode(code);
        apply(currency, request);
        currencyRepository.save(currency);
    }

    @Override
    @Transactional
    public void updateCurrency(UUID id, Map<String, Object> request) {
        Currency currency = currencyRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "货币不存在"));
        if (request.containsKey("code")) {
            String code = requiredString(request, "code").toUpperCase(Locale.ROOT);
            currencyRepository.findByCodeIgnoreCase(code)
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> {
                        throw new BusinessException(ErrorCode.BAD_REQUEST, "货币代码已存在");
                    });
            currency.setCode(code);
        }
        apply(currency, request);
        currencyRepository.save(currency);
    }

    @Override
    @Transactional
    public void deleteCurrency(UUID id) {
        Currency currency = currencyRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "货币不存在"));
        currencyRepository.delete(currency);
    }

    private void apply(Currency currency, Map<String, Object> request) {
        if (request.containsKey("name")) currency.setName(requiredString(request, "name"));
        if (request.containsKey("symbol")) currency.setSymbol(requiredString(request, "symbol"));
        if (request.containsKey("is_enabled")) currency.setEnabled(Boolean.TRUE.equals(request.get("is_enabled")));
        if (request.containsKey("sort_order")) currency.setSortOrder(((Number) request.get("sort_order")).intValue());
        if (request.containsKey("rate_to_cny")) {
            BigDecimal rate = new BigDecimal(String.valueOf(request.get("rate_to_cny")));
            if (rate.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "汇率必须大于 0");
            }
            currency.setRateToCny(rate);
        }
    }

    private Map<String, Object> toMap(Currency currency) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", currency.getId());
        map.put("code", currency.getCode());
        map.put("name", currency.getName());
        map.put("symbol", currency.getSymbol());
        map.put("rate_to_cny", currency.getRateToCny());
        map.put("is_enabled", currency.isEnabled());
        map.put("sort_order", currency.getSortOrder());
        map.put("created_at", currency.getCreatedAt());
        return map;
    }

    private String requiredString(Map<String, Object> request, String key) {
        Object value = request.get(key);
        if (value == null || value.toString().isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, key + " 不能为空");
        }
        return value.toString().trim();
    }
}
