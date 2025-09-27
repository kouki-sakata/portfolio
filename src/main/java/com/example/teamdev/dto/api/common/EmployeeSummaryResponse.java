package com.example.teamdev.dto.api.common;

import io.swagger.v3.oas.annotations.media.Schema;

public record EmployeeSummaryResponse(
    @Schema(description = "従業員ID", example = "101") Integer id,
    @Schema(description = "名", example = "太郎") String firstName,
    @Schema(description = "姓", example = "山田") String lastName,
    @Schema(description = "メールアドレス", example = "yamada.taro@example.com") String email,
    @Schema(description = "管理者フラグ", example = "true") boolean admin
) {
}
