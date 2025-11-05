package com.example.teamdev.dto.api.profile;

public record ProfileMetadataResponse(
    String address,
    String department,
    String employeeNumber,
    String activityNote,
    String location,
    String manager,
    String workStyle,
    ProfileScheduleResponse schedule,
    String status,
    String joinedAt,
    String avatarUrl
) {}
