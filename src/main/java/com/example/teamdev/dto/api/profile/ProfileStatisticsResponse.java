package com.example.teamdev.dto.api.profile;

import java.util.List;

public record ProfileStatisticsResponse(
    AttendanceSummaryResponse summary,
    List<MonthlyAttendanceResponse> monthly
) {
}
