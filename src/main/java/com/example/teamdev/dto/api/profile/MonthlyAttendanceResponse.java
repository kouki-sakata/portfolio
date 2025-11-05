package com.example.teamdev.dto.api.profile;

public record MonthlyAttendanceResponse(
    String month,
    int totalHours,
    int overtimeHours,
    int lateCount,
    int paidLeaveHours
) {
}
