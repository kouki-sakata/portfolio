package com.example.teamdev.dto.api.stamprequest;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "打刻修正リクエスト取消リクエスト")
public record StampRequestCancellationRequest(
    @Schema(description = "取消理由", example = "再申請のため取り下げます", minLength = 10, maxLength = 500)
    @NotBlank
    @Size(min = 10, max = 500)
    String cancellationReason
) {
}
