package com.example.teamdev.dto.api.auth;

import com.example.teamdev.dto.api.common.EmployeeSummaryResponse;

public record SessionResponse(
    boolean authenticated,
    EmployeeSummaryResponse employee
) {
}
