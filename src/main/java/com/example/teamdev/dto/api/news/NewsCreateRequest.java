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
    @Schema(description = "タイトル（最大200文字）", example = "勤怠締め日のお知らせ")
    @NotBlank
    @Size(min = 1, max = 200)
    String title,
    @Schema(description = "お知らせ内容（最大1000文字）", example = "今月の勤怠締め日は月末です。期日までに必ず勤怠記録を確認してください。")
    @NotBlank
    @Size(min = 1, max = 1000)
    String content,
    @Schema(description = "カテゴリ（重要/システム/一般）", example = "重要")
    @NotBlank
    @Pattern(regexp = "^(重要|システム|一般)$")
    String category
) {
}
