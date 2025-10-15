package com.example.teamdev.dto.api.news;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

public record NewsListResponse(
    @Schema(description = "お知らせ一覧")
    List<NewsResponse> news
) {
}
