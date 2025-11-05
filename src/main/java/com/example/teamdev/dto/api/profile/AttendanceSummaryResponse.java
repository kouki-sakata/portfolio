package com.example.teamdev.dto.api.profile;

import java.util.List;

public record AttendanceSummaryResponse(
    CurrentMonthStats currentMonth,
    List<MonthlyTrendResponse> trendData
) {
    public record CurrentMonthStats(
        int totalHours,
        int overtimeHours,
        int lateCount,
        int paidLeaveHours
    ) {
    }
}
