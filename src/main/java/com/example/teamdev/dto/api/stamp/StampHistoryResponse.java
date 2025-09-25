package com.example.teamdev.dto.api.stamp;

import java.util.List;

public record StampHistoryResponse(
    String selectedYear,
    String selectedMonth,
    List<String> years,
    List<String> months,
    List<StampHistoryEntryResponse> entries
) {
}
