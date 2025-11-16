package com.example.teamdev.dto.api.stamprequest;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "打刻修正リクエスト一括操作の応答")
public record StampRequestBulkOperationResponse(
    @Schema(description = "成功件数", example = "3")
    int successCount,

    @Schema(description = "失敗件数", example = "1")
    int failureCount,

    @Schema(description = "失敗したリクエストのID一覧")
    List<Integer> failedRequestIds
) {
}
