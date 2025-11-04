package com.example.teamdev.service.profile.model;

/**
 * プロフィール表示用の従業員概要。
 */
public record ProfileEmployeeSummary(
    int id,
    String fullName,
    String email,
    boolean admin,
    String updatedAt
) {}
