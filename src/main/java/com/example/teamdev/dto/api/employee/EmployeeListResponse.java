package com.example.teamdev.dto.api.employee;

import com.example.teamdev.dto.api.common.EmployeeSummaryResponse;
import java.util.List;

public record EmployeeListResponse(
    List<EmployeeSummaryResponse> employees
) {
}
