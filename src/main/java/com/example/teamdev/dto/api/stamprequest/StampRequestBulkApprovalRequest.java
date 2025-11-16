package com.example.teamdev.dto.api.stamprequest;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

@Schema(description = "打刻修正リクエスト一括承認リクエスト")
public record StampRequestBulkApprovalRequest(
    @Schema(description = "処理対象のリクエストIDリスト", example = "[101,102]")
    @NotEmpty
    @Size(max = 50)
    List<Integer> requestIds,

    @Schema(description = "承認メモ", example = "内容確認済み", maxLength = 500)
    @Size(max = 500)
    String approvalNote
) {
}
