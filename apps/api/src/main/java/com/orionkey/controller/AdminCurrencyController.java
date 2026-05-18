package com.orionkey.controller;

import com.orionkey.annotation.LogOperation;
import com.orionkey.common.ApiResponse;
import com.orionkey.service.AdminCurrencyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin/currencies")
@RequiredArgsConstructor
public class AdminCurrencyController {

    private final AdminCurrencyService adminCurrencyService;

    @GetMapping
    public ApiResponse<?> listCurrencies() {
        return ApiResponse.success(adminCurrencyService.listCurrencies());
    }

    @LogOperation(action = "currency.create", targetType = "CURRENCY", detail = "'创建货币'")
    @PostMapping
    public ApiResponse<Void> createCurrency(@RequestBody Map<String, Object> request) {
        adminCurrencyService.createCurrency(request);
        return ApiResponse.success();
    }

    @LogOperation(action = "currency.update", targetType = "CURRENCY", targetId = "#id", detail = "'更新货币'")
    @PutMapping("/{id}")
    public ApiResponse<Void> updateCurrency(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        adminCurrencyService.updateCurrency(id, request);
        return ApiResponse.success();
    }

    @LogOperation(action = "currency.delete", targetType = "CURRENCY", targetId = "#id", detail = "'删除货币'")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteCurrency(@PathVariable UUID id) {
        adminCurrencyService.deleteCurrency(id);
        return ApiResponse.success();
    }
}
