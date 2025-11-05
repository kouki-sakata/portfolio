package com.example.teamdev.service.profile.model;

import java.util.List;
import java.util.Map;

/**
 * プロフィール更新時の差分情報。
 */
public record ProfileChangeSet(
    List<String> changedFields,
    Map<String, String> beforeSnapshot,
    Map<String, String> afterSnapshot,
    String summary
) {}
