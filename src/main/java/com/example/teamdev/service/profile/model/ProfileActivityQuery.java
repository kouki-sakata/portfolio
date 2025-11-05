package com.example.teamdev.service.profile.model;

import java.time.Instant;
import java.util.Optional;

/**
 * 活動履歴取得時の検索条件。
 */
public record ProfileActivityQuery(
    int page,
    int size,
    Optional<Instant> from,
    Optional<Instant> to
) {
    public ProfileActivityQuery {
        page = Math.max(page, 0);
        size = size <= 0 ? 20 : Math.min(size, 100);
        from = from != null ? from : Optional.empty();
        to = to != null ? to : Optional.empty();
    }
}
