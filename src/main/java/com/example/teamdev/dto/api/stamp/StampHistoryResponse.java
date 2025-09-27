package com.example.teamdev.dto.api.stamp;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

public record StampHistoryResponse(
    @Schema(description = "選択年", example = "2025") String selectedYear,
    @Schema(description = "選択月", example = "01") String selectedMonth,
    @Schema(description = "年の選択肢") List<String> years,
    @Schema(description = "月の選択肢") List<String> months,
    @Schema(description = "打刻履歴") List<StampHistoryEntryResponse> entries
) {
}
