package com.example.teamdev.service;

import com.example.teamdev.service.dto.DailyAttendanceRecord;
import com.example.teamdev.service.profile.model.ProfileWorkScheduleDocument;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

/**
 * 日次残業計算ユーティリティ。
 */
final class OvertimeCalculator {

    private OvertimeCalculator() {
    }

    static int calculateOvertimeMinutes(DailyAttendanceRecord record, ProfileWorkScheduleDocument schedule) {
        Objects.requireNonNull(record, "record must not be null");
        Objects.requireNonNull(schedule, "schedule must not be null");

        if (record.departureTime() == null || record.attendanceTime() == null) {
            return 0;
        }

        Duration worked = Duration.between(record.attendanceTime(), record.departureTime());
        if (record.breakStartTime() != null && record.breakEndTime() != null) {
            Duration breakDuration = Duration.between(record.breakStartTime(), record.breakEndTime());
            if (!breakDuration.isNegative()) {
                worked = worked.minus(breakDuration);
            }
        }

        Duration scheduled = parseScheduleDuration(schedule);
        Duration overtime = worked.minus(scheduled);
        if (overtime.isNegative()) {
            return 0;
        }
        return (int) overtime.truncatedTo(ChronoUnit.MINUTES).toMinutes();
    }

    private static Duration parseScheduleDuration(ProfileWorkScheduleDocument schedule) {
        LocalTime startTime = parseTimeOrDefault(schedule.start(), LocalTime.of(9, 0));
        LocalTime endTime = parseTimeOrDefault(schedule.end(), LocalTime.of(18, 0));
        OffsetDateTime start = OffsetDateTime.of(LocalDate.now(), startTime, ZoneOffset.UTC);
        OffsetDateTime end = OffsetDateTime.of(LocalDate.now(), endTime, ZoneOffset.UTC);

        Duration base = Duration.between(start, end);
        if (schedule.breakMinutes() > 0) {
            base = base.minus(Duration.ofMinutes(schedule.breakMinutes()));
        }
        return base.isNegative() ? Duration.ZERO : base;
    }

    private static LocalTime parseTimeOrDefault(String value, LocalTime defaultValue) {
        if (value == null || value.isBlank()) {
            return defaultValue;
        }
        return LocalTime.parse(value);
    }
}
