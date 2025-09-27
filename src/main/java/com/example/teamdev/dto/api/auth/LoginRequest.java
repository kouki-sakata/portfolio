package com.example.teamdev.dto.api.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @Schema(description = "ログイン用メールアドレス", example = "admin.user@example.com")
    @NotBlank @Email String email,
    @Schema(description = "ログイン用パスワード", example = "AdminPass123!")
    @NotBlank String password
) {
}
