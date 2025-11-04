package com.example.teamdev.dto.api.profile;

import java.util.List;
import java.util.Map;

public record ProfileActivityItemResponse(
    String id,
    String occurredAt,
    String actor,
    String operationType,
    String summary,
    List<String> changedFields,
    Map<String, String> beforeSnapshot,
    Map<String, String> afterSnapshot
) {}
