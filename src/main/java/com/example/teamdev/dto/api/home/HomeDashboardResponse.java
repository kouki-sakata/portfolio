package com.example.teamdev.dto.api.home;

import com.example.teamdev.dto.api.common.EmployeeSummaryResponse;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

public record HomeDashboardResponse(
    @Schema(description = "ログイン従業員情報") EmployeeSummaryResponse employee,
    @Schema(description = "お知らせ一覧") List<HomeNewsItem> news
) {
}
