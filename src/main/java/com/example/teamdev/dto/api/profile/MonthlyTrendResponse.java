package com.example.teamdev.dto.api.profile;

public record MonthlyTrendResponse(
    String month,
    int totalHours,
    int overtimeHours
) {
}
