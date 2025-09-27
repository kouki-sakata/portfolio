package com.example.teamdev.dto.api.home;

import io.swagger.v3.oas.annotations.media.Schema;

public record HomeNewsItem(
    @Schema(description = "ニュースID", example = "1") Integer id,
    @Schema(description = "本文", example = "システムメンテナンスを実施します") String content,
    @Schema(description = "日付", example = "2025-01-01") String newsDate,
    @Schema(description = "公開フラグ", example = "true") boolean released
) {
}
