package com.example.teamdev.dto.api.stamprequest;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "打刻修正リクエスト却下リクエスト")
public record StampRequestRejectionRequest(
    @Schema(description = "却下理由", example = "勤務実績と一致しないため却下します", minLength = 10, maxLength = 500)
    @NotBlank
    @Size(min = 10, max = 500)
    String rejectionReason
) {
}
