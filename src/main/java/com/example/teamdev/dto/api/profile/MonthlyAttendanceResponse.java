package com.example.teamdev.dto.api.profile;

import java.math.BigDecimal;

/**
 * 月別勤怠情報のレスポンス
 *
 * @param month 月(YYYY-MM形式)
 * @param totalHours 総労働時間
 * @param overtimeHours 残業時間
 * @param lateCount 遅刻回数
 * @param paidLeaveHours 有給消化時間
 */
public record MonthlyAttendanceResponse(
    String month,
    BigDecimal totalHours,
    BigDecimal overtimeHours,
    Integer lateCount,
    BigDecimal paidLeaveHours
) {}
