package com.example.teamdev.dto.api.employee;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record EmployeeDeleteRequest(
    @Schema(description = "削除対象の従業員ID一覧", example = "[101,102]")
    @NotEmpty List<Integer> ids
) {
}
