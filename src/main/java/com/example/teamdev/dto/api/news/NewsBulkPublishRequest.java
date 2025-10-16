package com.example.teamdev.dto.api.news;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * お知らせ一括公開/非公開リクエスト
 */
@Schema(description = "お知らせ一括公開/非公開リクエスト")
public record NewsBulkPublishRequest(
    @Schema(description = "公開ステータス変更リスト")
    @NotEmpty(message = "変更対象を最低1件指定してください")
    @Size(min = 1, max = 100, message = "一度に変更できるのは100件までです")
    @Valid
    List<NewsPublishItem> items
) {
    /**
     * お知らせ公開ステータス変更アイテム
     */
    @Schema(description = "お知らせ公開ステータス変更アイテム")
    public record NewsPublishItem(
        @Schema(description = "お知らせID", example = "42")
        @NotNull(message = "お知らせIDは必須です")
        Integer id,

        @Schema(description = "公開フラグ", example = "true")
        @NotNull(message = "公開フラグは必須です")
        Boolean releaseFlag
    ) {}
}