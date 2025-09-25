package com.example.teamdev.dto.api.common;

public record EmployeeSummaryResponse(
    Integer id,
    String firstName,
    String lastName,
    String email,
    boolean admin
) {
}
