package com.example.teamdev.dto.api.auth;

import com.example.teamdev.dto.api.common.EmployeeSummaryResponse;

public record LoginResponse(
    EmployeeSummaryResponse employee
) {
}
