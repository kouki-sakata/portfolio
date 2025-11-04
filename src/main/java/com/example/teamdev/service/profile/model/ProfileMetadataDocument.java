package com.example.teamdev.service.profile.model;

/**
 * プロフィールメタデータのDTO。
 */
public record ProfileMetadataDocument(
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
) {
    public ProfileMetadataDocument {
        address = defaultString(address);
        department = defaultString(department);
        employeeNumber = defaultString(employeeNumber);
        activityNote = defaultString(activityNote);
        location = defaultString(location);
        manager = defaultString(manager);
        workStyle = defaultString(workStyle);
        schedule = schedule != null ? schedule : new ProfileWorkScheduleDocument("", "", 0);
        status = defaultString(status);
        joinedAt = defaultString(joinedAt);
        avatarUrl = defaultString(avatarUrl);
    }

    private static String defaultString(String value) {
        return value != null ? value : "";
    }
}
