package com.example.teamdev.service.profile.model;

/**
 * 勤務スケジュール情報のDTO。
 */
public record ProfileWorkScheduleDocument(
    String start,
    String end,
    int breakMinutes
) {
    public ProfileWorkScheduleDocument {
        start = start != null ? start : "";
        end = end != null ? end : "";
    }
}
