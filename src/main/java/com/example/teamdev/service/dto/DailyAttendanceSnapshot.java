package com.example.teamdev.service.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * ホーム画面向けに整形された当日勤怠スナップショット。
 */
public record DailyAttendanceSnapshot(
    @Schema(description = "勤務ステータス") AttendanceStatus status,
    @Schema(description = "出勤時刻 (ISO8601, JST)", nullable = true) String attendanceTime,
    @Schema(description = "休憩開始時刻 (ISO8601, JST)", nullable = true) String breakStartTime,
    @Schema(description = "休憩終了時刻 (ISO8601, JST)", nullable = true) String breakEndTime,
    @Schema(description = "退勤時刻 (ISO8601, JST)", nullable = true) String departureTime,
    @Schema(description = "残業分数", nullable = true) Integer overtimeMinutes
) {
}
