package com.example.teamdev.dto.api.stamprequest;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

@Schema(description = "打刻修正リクエスト一括却下リクエスト")
public record StampRequestBulkRejectionRequest(
    @Schema(description = "処理対象のリクエストIDリスト", example = "[201,202]")
    @NotEmpty
    @Size(max = 50)
    List<Integer> requestIds,

    @Schema(description = "共通却下理由", example = "証跡と一致しません", minLength = 10, maxLength = 500)
    @NotBlank
    @Size(min = 10, max = 500)
    String rejectionReason
) {
}
