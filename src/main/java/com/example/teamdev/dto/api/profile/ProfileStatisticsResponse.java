package com.example.teamdev.dto.api.profile;

import java.util.List;

/**
 * プロフィール統計情報のレスポンス
 *
 * @param summary 当月のサマリー情報と6ヶ月のトレンド
 * @param monthly 月別の詳細な勤怠データ
 */
public record ProfileStatisticsResponse(
    AttendanceSummaryResponse summary,
    List<MonthlyAttendanceResponse> monthly
) {}
