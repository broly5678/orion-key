package com.orionkey.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminResetPasswordRequest {

    @NotBlank(message = "New password is required")
    @Size(min = 5, message = "New password must be at least 5 characters")
    private String newPassword;
}
