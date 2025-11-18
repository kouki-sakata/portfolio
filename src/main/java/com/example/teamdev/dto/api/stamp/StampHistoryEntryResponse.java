package com.example.teamdev.dto.api.stamp;

import io.swagger.v3.oas.annotations.media.Schema;

public record StampHistoryEntryResponse(
    @Schema(description = "ID", example = "10", nullable = true) Integer id,
    @Schema(description = "年", example = "2025") String year,
    @Schema(description = "月", example = "01") String month,
    @Schema(description = "日", example = "15") String day,
    @Schema(description = "曜日", example = "MON") String dayOfWeek,
    @Schema(description = "従業員ID", example = "101") Integer employeeId,
    @Schema(description = "従業員名", example = "山田 太郎") String employeeName,
    @Schema(description = "更新者名", example = "管理者 一郎") String updateEmployeeName,
    @Schema(description = "出勤時刻", example = "09:00", nullable = true) String inTime,
    @Schema(description = "退勤時刻", example = "18:00", nullable = true) String outTime,
    @Schema(description = "休憩開始時刻", example = "12:00", nullable = true) String breakStartTime,
    @Schema(description = "休憩終了時刻", example = "12:45", nullable = true) String breakEndTime,
    @Schema(description = "残業分数", example = "60", nullable = true) Integer overtimeMinutes,
    @Schema(description = "夜勤フラグ", example = "false", nullable = true) Boolean isNightShift,
    @Schema(description = "更新日時", example = "2025-01-15 18:01:00", nullable = true) String updateDate,
    @Schema(description = "申請ステータス", example = "PENDING", nullable = true) String requestStatus,
    @Schema(description = "申請ID", example = "123", nullable = true) Integer requestId
) {
}
