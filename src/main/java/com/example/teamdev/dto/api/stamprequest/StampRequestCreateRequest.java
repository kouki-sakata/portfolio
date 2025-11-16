package com.example.teamdev.dto.api.stamprequest;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

@Schema(description = "打刻修正リクエストの作成リクエスト")
public record StampRequestCreateRequest(
    @Schema(description = "紐づく打刻履歴ID", example = "101")
    @NotNull
    Integer stampHistoryId,

    @Schema(description = "希望する出勤時刻", example = "2025-11-15T08:30:00+09:00")
    OffsetDateTime requestedInTime,

    @Schema(description = "希望する退勤時刻", example = "2025-11-15T17:30:00+09:00")
    OffsetDateTime requestedOutTime,

    @Schema(description = "希望する休憩開始時刻", example = "2025-11-15T12:00:00+09:00")
    OffsetDateTime requestedBreakStartTime,

    @Schema(description = "希望する休憩終了時刻", example = "2025-11-15T12:45:00+09:00")
    OffsetDateTime requestedBreakEndTime,

    @Schema(description = "夜勤フラグ", example = "false")
    Boolean requestedIsNightShift,

    @Schema(description = "修正理由", example = "システム障害により退勤時刻が記録されませんでした", minLength = 10, maxLength = 500)
    @NotBlank
    @Size(min = 10, max = 500)
    String reason
) {
}
