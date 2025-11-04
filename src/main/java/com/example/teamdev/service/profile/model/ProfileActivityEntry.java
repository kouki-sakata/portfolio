package com.example.teamdev.service.profile.model;

import java.util.List;
import java.util.Map;

/**
 * プロフィール活動履歴の1レコード。
 */
public record ProfileActivityEntry(
    String id,
    String occurredAt,
    String actor,
    String operationType,
    String summary,
    List<String> changedFields,
    Map<String, String> beforeSnapshot,
    Map<String, String> afterSnapshot
) {}
