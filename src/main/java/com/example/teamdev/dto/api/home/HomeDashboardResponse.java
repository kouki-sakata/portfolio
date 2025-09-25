package com.example.teamdev.dto.api.home;

import com.example.teamdev.dto.api.common.EmployeeSummaryResponse;
import java.util.List;

public record HomeDashboardResponse(
    EmployeeSummaryResponse employee,
    List<HomeNewsItem> news
) {
}
