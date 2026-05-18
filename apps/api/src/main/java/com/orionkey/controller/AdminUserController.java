package com.orionkey.controller;

import com.orionkey.annotation.LogOperation;
import com.orionkey.common.ApiResponse;
import com.orionkey.model.request.AdminResetPasswordRequest;
import com.orionkey.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ApiResponse<?> listUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(value = "page_size", defaultValue = "20") int pageSize) {
        return ApiResponse.success(adminUserService.listUsers(keyword, page, pageSize));
    }

    @LogOperation(action = "user.toggle", targetType = "USER", targetId = "#id", detail = "'切换用户状态'")
    @PostMapping("/{id}/toggle")
    public ApiResponse<Void> toggleUser(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        int isDeleted = ((Number) request.get("is_deleted")).intValue();
        adminUserService.toggleUser(id, isDeleted);
        return ApiResponse.success();
    }

    @LogOperation(action = "user.reset_password", targetType = "USER", targetId = "#id", detail = "'管理员重置用户密码'")
    @PutMapping("/{id}/password")
    public ApiResponse<Void> resetPassword(@PathVariable UUID id, @Valid @RequestBody AdminResetPasswordRequest request) {
        adminUserService.resetPassword(id, request.getNewPassword());
        return ApiResponse.success();
    }
}
