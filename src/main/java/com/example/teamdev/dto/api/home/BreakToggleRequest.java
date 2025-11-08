package com.example.teamdev.dto.api.home;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record BreakToggleRequest(
    @Schema(description = "休憩トグル時刻(ISO8601)", example = "2025-11-07T12:00:00+09:00")
    @NotBlank
    String timestamp
) {
}
