package com.example.teamdev.dto.api.profile;

import java.math.BigDecimal;
import java.util.List;

/**
 * 勤怠サマリー情報のレスポンス
 *
 * @param currentMonth 当月の勤怠サマリー
 * @param trendData 過去6ヶ月間のトレンドデータ
 */
public record AttendanceSummaryResponse(
    CurrentMonthData currentMonth,
    List<MonthlyTrendResponse> trendData
) {
    /**
     * 当月の勤怠データ
     *
     * @param totalHours 月間総労働時間
     * @param overtimeHours 月間残業時間
     * @param lateCount 遅刻回数
     * @param paidLeaveHours 有給消化時間
     */
    public record CurrentMonthData(
        BigDecimal totalHours,
        BigDecimal overtimeHours,
        Integer lateCount,
        BigDecimal paidLeaveHours
    ) {}

    /**
     * 月別トレンド情報
     *
     * @param month 月(YYYY-MM形式)
     * @param totalHours 総労働時間
     * @param overtimeHours 残業時間
     */
    public record MonthlyTrendResponse(
        String month,
        BigDecimal totalHours,
        BigDecimal overtimeHours
    ) {}
}
