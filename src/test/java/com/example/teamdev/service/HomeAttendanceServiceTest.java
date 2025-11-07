package com.example.teamdev.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.example.teamdev.mapper.StampHistoryMapper;
import com.example.teamdev.service.dto.AttendanceStatus;
import com.example.teamdev.service.dto.DailyAttendanceRecord;
import com.example.teamdev.service.dto.DailyAttendanceSnapshot;
import com.example.teamdev.service.profile.ProfileMetadataRepository;
import com.example.teamdev.service.profile.model.ProfileMetadataDocument;
import com.example.teamdev.service.profile.model.ProfileWorkScheduleDocument;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class HomeAttendanceServiceTest {

    @Mock
    private StampHistoryMapper stampHistoryMapper;

    @Mock
    private ProfileMetadataRepository profileMetadataRepository;

    @InjectMocks
    private HomeAttendanceService homeAttendanceService;

    private ProfileMetadataDocument schedule;

    @BeforeEach
    void setUp() {
        schedule = new ProfileMetadataDocument(
            "",
            "",
            "",
            "",
            "",
            "",
            "onsite",
            new ProfileWorkScheduleDocument("09:00", "18:00", 60),
            "active",
            "",
            ""
        );

        when(profileMetadataRepository.load(eq(100))).thenReturn(schedule);
    }

    @DisplayName("出勤済み・休憩前は勤務中ステータスを返す")
    @Test
    void workingStatusBeforeBreak() {
        OffsetDateTime now = OffsetDateTime.of(2025, 11, 7, 10, 0, 0, 0, ZoneOffset.UTC);
        when(stampHistoryMapper.selectDailyAttendance(eq(100), any()))
            .thenReturn(Optional.of(new DailyAttendanceRecord(
                now.minusHours(1),
                null,
                null,
                null
            )));

        Optional<DailyAttendanceSnapshot> result = homeAttendanceService.fetchTodaySnapshot(100, ZoneId.of("Asia/Tokyo"));

        assertThat(result).isPresent();
        assertThat(result.get().status()).isEqualTo(AttendanceStatus.WORKING);
        assertThat(result.get().attendanceTime()).isEqualTo("2025-11-07T18:00:00+09:00");
        assertThat(result.get().overtimeMinutes()).isEqualTo(0);
    }

    @DisplayName("休憩開始済みで戻っていない場合は休憩中ステータスを返す")
    @Test
    void onBreakStatus() {
        OffsetDateTime in = OffsetDateTime.of(2025, 11, 7, 0, 0, 0, 0, ZoneOffset.UTC);
        OffsetDateTime breakStart = in.plusHours(4);

        when(stampHistoryMapper.selectDailyAttendance(eq(100), any()))
            .thenReturn(Optional.of(new DailyAttendanceRecord(
                in,
                breakStart,
                null,
                null
            )));

        Optional<DailyAttendanceSnapshot> result = homeAttendanceService.fetchTodaySnapshot(100, ZoneId.of("Asia/Tokyo"));

        assertThat(result).isPresent();
        assertThat(result.get().status()).isEqualTo(AttendanceStatus.ON_BREAK);
        assertThat(result.get().breakStartTime()).isEqualTo("2025-11-07T13:00:00+09:00");
    }

    @DisplayName("退勤済みの場合は勤務終了ステータスと残業分数を返す")
    @Test
    void finishedStatusWithOvertime() {
        OffsetDateTime in = OffsetDateTime.of(2025, 11, 7, 0, 0, 0, 0, ZoneOffset.UTC);
        OffsetDateTime out = in.plusHours(11); // 2時間残業（休憩1h込み）
        OffsetDateTime breakStart = in.plusHours(4);
        OffsetDateTime breakEnd = breakStart.plusHours(1);

        when(stampHistoryMapper.selectDailyAttendance(eq(100), any()))
            .thenReturn(Optional.of(new DailyAttendanceRecord(
                in,
                breakStart,
                breakEnd,
                out
            )));

        Optional<DailyAttendanceSnapshot> result = homeAttendanceService.fetchTodaySnapshot(100, ZoneId.of("Asia/Tokyo"));

        assertThat(result).isPresent();
        DailyAttendanceSnapshot snapshot = result.get();
        assertThat(snapshot.status()).isEqualTo(AttendanceStatus.FINISHED);
        assertThat(snapshot.breakStartTime()).isEqualTo("2025-11-07T13:00:00+09:00");
        assertThat(snapshot.breakEndTime()).isEqualTo("2025-11-07T14:00:00+09:00");
        assertThat(snapshot.overtimeMinutes()).isEqualTo(120);
    }

    @DisplayName("打刻がない場合はOptional.emptyを返す")
    @Test
    void emptyWhenNoRecord() {
        when(stampHistoryMapper.selectDailyAttendance(eq(100), any())).thenReturn(Optional.empty());

        Optional<DailyAttendanceSnapshot> result = homeAttendanceService.fetchTodaySnapshot(100, ZoneId.of("Asia/Tokyo"));

        assertThat(result).isPresent();
        assertThat(result.get().status()).isEqualTo(AttendanceStatus.NOT_ATTENDED);
    }
}
