package com.example.teamdev.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.teamdev.service.dto.DailyAttendanceRecord;
import com.example.teamdev.service.profile.model.ProfileWorkScheduleDocument;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class OvertimeCalculatorTest {

    @DisplayName("定時内勤務は残業0分")
    @Test
    void noOvertimeWhenWithinSchedule() {
        DailyAttendanceRecord record = new DailyAttendanceRecord(
            OffsetDateTime.of(2025, 11, 7, 0, 0, 0, 0, ZoneOffset.UTC),
            OffsetDateTime.of(2025, 11, 7, 4, 0, 0, 0, ZoneOffset.UTC),
            OffsetDateTime.of(2025, 11, 7, 5, 0, 0, 0, ZoneOffset.UTC),
            OffsetDateTime.of(2025, 11, 7, 8, 0, 0, 0, ZoneOffset.UTC)
        );
        ProfileWorkScheduleDocument schedule = new ProfileWorkScheduleDocument("09:00", "18:00", 60);

        int overtime = OvertimeCalculator.calculateOvertimeMinutes(record, schedule);

        assertThat(overtime).isZero();
    }

    @DisplayName("実働が所定を超えると残業分数を返す")
    @Test
    void positiveOvertime() {
        DailyAttendanceRecord record = new DailyAttendanceRecord(
            OffsetDateTime.of(2025, 11, 7, 0, 0, 0, 0, ZoneOffset.UTC),
            OffsetDateTime.of(2025, 11, 7, 4, 0, 0, 0, ZoneOffset.UTC),
            OffsetDateTime.of(2025, 11, 7, 5, 0, 0, 0, ZoneOffset.UTC),
            OffsetDateTime.of(2025, 11, 7, 11, 0, 0, 0, ZoneOffset.UTC)
        );
        ProfileWorkScheduleDocument schedule = new ProfileWorkScheduleDocument("09:00", "18:00", 60);

        int overtime = OvertimeCalculator.calculateOvertimeMinutes(record, schedule);

        assertThat(overtime).isEqualTo(120);
    }

    @DisplayName("退勤打刻がない場合は残業0扱い")
    @Test
    void zeroWhenMissingOutTime() {
        DailyAttendanceRecord record = new DailyAttendanceRecord(
            OffsetDateTime.now(),
            OffsetDateTime.now().plusHours(3),
            null,
            null
        );
        ProfileWorkScheduleDocument schedule = new ProfileWorkScheduleDocument("09:00", "18:00", 60);

        int overtime = OvertimeCalculator.calculateOvertimeMinutes(record, schedule);

        assertThat(overtime).isZero();
    }

    @DisplayName("休憩時間が記録されていない場合はスケジュールの休憩時間を使用")
    @Test
    void useScheduleBreakWhenBreakNotRecorded() {
        // 9時間9分勤務、休憩記録なし
        DailyAttendanceRecord record = new DailyAttendanceRecord(
            OffsetDateTime.of(2025, 11, 1, 18, 0, 0, 0, ZoneOffset.UTC),
            null,
            null,
            OffsetDateTime.of(2025, 11, 2, 3, 9, 0, 0, ZoneOffset.UTC)
        );
        ProfileWorkScheduleDocument schedule = new ProfileWorkScheduleDocument("09:00", "18:00", 60);

        int overtime = OvertimeCalculator.calculateOvertimeMinutes(record, schedule);

        // 実働: 9h9m - 1h(スケジュール休憩) = 8h9m
        // 残業: 8h9m - 8h = 9分
        assertThat(overtime).isEqualTo(9);
    }

    @DisplayName("休憩時間が記録されている場合は実際の休憩時間を優先")
    @Test
    void useActualBreakWhenRecorded() {
        // 9時間9分勤務、2時間休憩
        DailyAttendanceRecord record = new DailyAttendanceRecord(
            OffsetDateTime.of(2025, 11, 1, 18, 0, 0, 0, ZoneOffset.UTC),
            OffsetDateTime.of(2025, 11, 1, 21, 0, 0, 0, ZoneOffset.UTC),
            OffsetDateTime.of(2025, 11, 1, 23, 0, 0, 0, ZoneOffset.UTC),
            OffsetDateTime.of(2025, 11, 2, 3, 9, 0, 0, ZoneOffset.UTC)
        );
        ProfileWorkScheduleDocument schedule = new ProfileWorkScheduleDocument("09:00", "18:00", 60);

        int overtime = OvertimeCalculator.calculateOvertimeMinutes(record, schedule);

        // 実働: 9h9m - 2h(実際の休憩) = 7h9m
        // 残業: 7h9m - 8h = 0（負数なので0）
        assertThat(overtime).isZero();
    }
}
