package com.example.teamdev.service.profile.model;

import java.util.List;

/**
 * プロフィール活動履歴のページング結果。
 */
public record ProfileActivityPage(
    int page,
    int size,
    int totalPages,
    long totalElements,
    List<ProfileActivityEntry> items
) {}
