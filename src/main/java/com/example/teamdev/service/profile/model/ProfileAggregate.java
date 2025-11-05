package com.example.teamdev.service.profile.model;

/**
 * プロフィール取得結果の集約。
 */
public record ProfileAggregate(
    ProfileEmployeeSummary employee,
    ProfileMetadataDocument metadata
) {}
