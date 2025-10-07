package com.example.teamdev.dto.api.auth;

import com.example.teamdev.dto.api.common.EmployeeSummaryResponse;
import io.swagger.v3.oas.annotations.media.Schema;

public record SessionResponse(
    boolean authenticated,
    @Schema(nullable = true) EmployeeSummaryResponse employee
) {
}
