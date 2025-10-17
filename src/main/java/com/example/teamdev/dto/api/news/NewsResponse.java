package com.example.teamdev.dto.api.news;

import io.swagger.v3.oas.annotations.media.Schema;

public record NewsResponse(
    @Schema(description = "お知らせID", example = "42")
    Integer id,
    @Schema(description = "お知らせ日付（YYYY-MM-DD形式）", example = "2025-10-15")
    String newsDate,
    @Schema(description = "タイトル（最大200文字）", example = "勤怠締め日のお知らせ")
    String title,
    @Schema(description = "お知らせ内容（最大1000文字）", example = "今月の勤怠締め日は月末です。期日までに必ず勤怠記録を確認してください。")
    String content,
    @Schema(description = "カテゴリ（重要/システム/一般）", example = "重要")
    String category,
    @Schema(description = "公開フラグ（true: 公開, false: 下書き）", example = "true")
    boolean releaseFlag,
    @Schema(description = "更新日時（ISO 8601形式）", example = "2025-10-15T12:34:56Z")
    String updateDate
) {
}
