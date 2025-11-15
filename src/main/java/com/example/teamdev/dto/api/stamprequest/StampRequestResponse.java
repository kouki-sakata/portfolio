package com.example.teamdev.dto.api.stamprequest;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "打刻修正リクエストのレスポンス")
public record StampRequestResponse(
    @Schema(description = "リクエストID", example = "501")
    Integer id,

    @Schema(description = "従業員ID", example = "42")
    Integer employeeId,

    @Schema(description = "従業員氏名", example = "山田 太郎")
    String employeeName,

    @Schema(description = "紐づく打刻履歴ID", example = "231")
    Integer stampHistoryId,

    @Schema(description = "対象日 (YYYY-MM-DD)", example = "2025-11-14")
    String stampDate,

    @Schema(description = "オリジナル出勤時刻", example = "2025-11-14T09:00:00+09:00")
    String originalInTime,

    @Schema(description = "オリジナル退勤時刻", example = "2025-11-14T18:00:00+09:00")
    String originalOutTime,

    @Schema(description = "オリジナル休憩開始", example = "2025-11-14T12:00:00+09:00")
    String originalBreakStartTime,

    @Schema(description = "オリジナル休憩終了", example = "2025-11-14T12:45:00+09:00")
    String originalBreakEndTime,

    @Schema(description = "オリジナル夜勤フラグ", example = "false")
    Boolean originalIsNightShift,

    @Schema(description = "修正後の出勤時刻", example = "2025-11-14T09:30:00+09:00")
    String requestedInTime,

    @Schema(description = "修正後の退勤時刻", example = "2025-11-14T18:30:00+09:00")
    String requestedOutTime,

    @Schema(description = "修正後の休憩開始", example = "2025-11-14T12:10:00+09:00")
    String requestedBreakStartTime,

    @Schema(description = "修正後の休憩終了", example = "2025-11-14T12:55:00+09:00")
    String requestedBreakEndTime,

    @Schema(description = "修正後の夜勤フラグ", example = "false")
    Boolean requestedIsNightShift,

    @Schema(description = "申請理由", example = "残業のため退勤が遅れました")
    String reason,

    @Schema(description = "ステータス", example = "PENDING", allowableValues = {"NEW", "PENDING", "APPROVED", "REJECTED", "CANCELLED"})
    String status,

    @Schema(description = "承認メモ", example = "内容確認済み")
    String approvalNote,

    @Schema(description = "却下理由", example = "証跡と一致しません")
    String rejectionReason,

    @Schema(description = "取消理由", example = "再申請のため")
    String cancellationReason,

    @Schema(description = "承認者ID", example = "7")
    Integer approvalEmployeeId,

    @Schema(description = "承認者氏名", example = "管理者 一郎")
    String approvalEmployeeName,

    @Schema(description = "作成日時 (ISO 8601)", example = "2025-11-14T10:00:00Z")
    String createdAt,

    @Schema(description = "更新日時 (ISO 8601)")
    String updatedAt,

    @Schema(description = "承認日時 (ISO 8601)")
    String approvedAt,

    @Schema(description = "却下日時 (ISO 8601)")
    String rejectedAt,

    @Schema(description = "取消日時 (ISO 8601)")
    String cancelledAt,

    @Schema(description = "提出タイムスタンプ (epoch milliseconds)", example = "1763114400000")
    Long submittedTimestamp,

    @Schema(description = "最終更新タイムスタンプ (epoch milliseconds)", example = "1763120000000")
    Long updatedTimestamp
) {
}
