package com.example.teamdev.service.profile.model;

import java.math.BigDecimal;
import java.util.List;

/**
 * プロフィール統計データ。
 */
public record ProfileStatisticsData(
    AttendanceSummaryData summary,
    List<MonthlyAttendanceData> monthly
) {
    /**
     * 勤怠サマリーデータ（当月 + 直近6ヶ月のトレンド）。
     */
    public record AttendanceSummaryData(
        BigDecimal totalHours,
        BigDecimal overtimeHours,
        Integer lateCount,
        BigDecimal paidLeaveHours,
        List<MonthlyTrendData> trend
    ) {}

    /**
     * 月次トレンドデータ。
     */
    public record MonthlyTrendData(
        String month,
        BigDecimal totalHours,
        BigDecimal overtimeHours
    ) {}

    /**
     * 月次勤怠データ。
     */
    public record MonthlyAttendanceData(
        String month,
        BigDecimal totalHours,
        BigDecimal overtimeHours,
        Integer lateCount,
        BigDecimal paidLeaveHours
    ) {}
}
