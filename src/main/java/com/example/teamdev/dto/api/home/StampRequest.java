package com.example.teamdev.dto.api.home;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record StampRequest(
    @Schema(description = "打刻種別", example = "ATTENDANCE")
    @NotBlank String stampType,
    @Schema(description = "打刻時刻(ISO)", example = "2025-01-01T09:00:00")
    @NotBlank String stampTime,
    @Schema(description = "深夜勤務フラグ", example = "0")
    @NotBlank String nightWorkFlag
) {
}
