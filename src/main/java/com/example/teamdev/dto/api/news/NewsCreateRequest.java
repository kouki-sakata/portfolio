package com.example.teamdev.dto.api.news;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record NewsCreateRequest(
    @Schema(description = "お知らせ日付（YYYY-MM-DD形式）", example = "2025-10-15")
    @NotBlank
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$")
    String newsDate,
    @Schema(description = "お知らせ内容（最大1000文字）", example = "システムメンテナンスのお知らせ")
    @NotBlank
    @Size(min = 1, max = 1000)
    String content
) {
}
