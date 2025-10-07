package com.example.teamdev.dto.api.auth;

import com.example.teamdev.dto.api.common.EmployeeSummaryResponse;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record SessionResponse(
    boolean authenticated,
    @Schema(nullable = true) EmployeeSummaryResponse employee
) {
}
