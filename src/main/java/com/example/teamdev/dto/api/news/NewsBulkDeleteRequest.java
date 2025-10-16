package com.example.teamdev.dto.api.news;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * お知らせ一括削除リクエスト
 */
@Schema(description = "お知らせ一括削除リクエスト")
public record NewsBulkDeleteRequest(
    @Schema(description = "削除するお知らせIDのリスト", example = "[1, 2, 3]")
    @NotEmpty(message = "削除するIDを最低1件指定してください")
    @Size(min = 1, max = 100, message = "一度に削除できるのは100件までです")
    List<Integer> ids
) {
}