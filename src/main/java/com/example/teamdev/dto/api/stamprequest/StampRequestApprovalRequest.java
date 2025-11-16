package com.example.teamdev.dto.api.stamprequest;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

@Schema(description = "打刻修正リクエスト承認リクエスト")
public record StampRequestApprovalRequest(
    @Schema(description = "承認メモ", example = "内容を確認しました", maxLength = 500)
    @Size(max = 500)
    String approvalNote
) {
}
