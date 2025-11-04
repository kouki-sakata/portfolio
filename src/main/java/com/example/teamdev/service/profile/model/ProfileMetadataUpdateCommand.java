package com.example.teamdev.service.profile.model;

/**
 * プロフィール更新リクエストを表すコマンド。
 */
public record ProfileMetadataUpdateCommand(
    String address,
    String department,
    String employeeNumber,
    String activityNote,
    String location,
    String manager,
    String workStyle,
    ProfileWorkScheduleDocument schedule,
    String status,
    String joinedAt,
    String avatarUrl
) {}
