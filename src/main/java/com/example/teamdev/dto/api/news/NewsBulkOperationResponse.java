package com.example.teamdev.dto.api.news;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

/**
 * お知らせ一括操作レスポンス
 */
@Schema(description = "お知らせ一括操作レスポンス")
public record NewsBulkOperationResponse(
    @Schema(description = "成功件数", example = "5")
    int successCount,

    @Schema(description = "失敗件数", example = "0")
    int failureCount,

    @Schema(description = "処理結果の詳細")
    List<OperationResult> results
) {
    /**
     * 操作結果
     */
    @Schema(description = "個別の操作結果")
    public record OperationResult(
        @Schema(description = "お知らせID", example = "42")
        Integer id,

        @Schema(description = "成功/失敗", example = "true")
        boolean success,

        @Schema(description = "エラーメッセージ（失敗時のみ）", example = "お知らせが見つかりません")
        String errorMessage
    ) {}
}