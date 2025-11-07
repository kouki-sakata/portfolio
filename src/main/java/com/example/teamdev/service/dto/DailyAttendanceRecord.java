package com.example.teamdev.service.dto;

import java.time.OffsetDateTime;

/**
 * 当日勤怠レコード（DBからの生データ）。
 */
public record DailyAttendanceRecord(
    OffsetDateTime attendanceTime,
    OffsetDateTime breakStartTime,
    OffsetDateTime breakEndTime,
    OffsetDateTime departureTime
) {
}
