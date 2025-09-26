package com.example.teamdev.dto.api.employee;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EmployeeUpsertRequest(
    @Schema(description = "名", example = "太郎")
    @NotBlank String firstName,
    @Schema(description = "姓", example = "山田")
    @NotBlank String lastName,
    @Schema(description = "メールアドレス", example = "yamada.taro@example.com")
    @NotBlank @Email String email,
    @Schema(description = "パスワード（新規時は必須、更新時は省略可）", example = "Passw0rd!@#")
    @Size(min = 8, message = "Password must be at least 8 characters") String password,
    @Schema(description = "管理者フラグ", example = "false")
    boolean admin
) {
}
