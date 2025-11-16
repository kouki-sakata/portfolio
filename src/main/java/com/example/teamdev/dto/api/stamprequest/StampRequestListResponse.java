package com.example.teamdev.dto.api.stamprequest;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "打刻修正リクエスト一覧レスポンス")
public record StampRequestListResponse(
    @Schema(description = "リクエスト一覧")
    List<StampRequestResponse> requests,

    @Schema(description = "総件数", example = "120")
    Integer totalCount,

    @Schema(description = "現在のページ番号", example = "0")
    Integer pageNumber,

    @Schema(description = "ページサイズ", example = "20")
    Integer pageSize
) {
}
