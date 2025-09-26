package com.example.teamdev.dto.api.stamp;

import io.swagger.v3.oas.annotations.media.Schema;

public record StampHistoryEntryResponse(
    @Schema(description = "ID", example = "10") Integer id,
    @Schema(description = "年", example = "2025") String year,
    @Schema(description = "月", example = "01") String month,
    @Schema(description = "日", example = "15") String day,
    @Schema(description = "曜日", example = "MON") String dayOfWeek,
    @Schema(description = "従業員ID", example = "101") Integer employeeId,
    @Schema(description = "従業員名", example = "山田 太郎") String employeeName,
    @Schema(description = "更新者名", example = "管理者 一郎") String updateEmployeeName,
    @Schema(description = "出勤時刻", example = "09:00") String inTime,
    @Schema(description = "退勤時刻", example = "18:00") String outTime,
    @Schema(description = "更新日時", example = "2025-01-15 18:01:00") String updateDate
) {
}
