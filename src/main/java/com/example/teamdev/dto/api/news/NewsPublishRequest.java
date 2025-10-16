package com.example.teamdev.dto.api.news;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

public record NewsPublishRequest(
    @Schema(description = "公開フラグ（true: 公開, false: 非公開）", example = "true")
    @NotNull
    Boolean releaseFlag
) {
}
