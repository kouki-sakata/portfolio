package com.example.teamdev.dto.api.auth;

import com.example.teamdev.dto.api.common.EmployeeSummaryResponse;
import io.swagger.v3.oas.annotations.media.Schema;

public record LoginResponse(
    @Schema(description = "ログインした従業員の概要")
    EmployeeSummaryResponse employee
) {
}
