package com.example.teamdev.dto.api.home;

import io.swagger.v3.oas.annotations.media.Schema;

public record StampResponse(
    @Schema(description = "打刻結果メッセージ", example = "09:00 に出勤を記録しました")
    String message
) {
}
