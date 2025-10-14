package com.example.teamdev.service;

import com.example.teamdev.entity.StampHistory;
import com.example.teamdev.exception.DuplicateStampException;
import com.example.teamdev.form.HomeForm;
import com.example.teamdev.mapper.StampHistoryMapper;
import com.example.teamdev.constant.AppConstants;
import com.example.teamdev.dto.api.home.StampType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class StampServiceTest {

    @Mock
    private StampHistoryMapper mapper;

    @Mock
    private LogHistoryRegistrationService logHistoryService;

    @InjectMocks
    private StampService stampService;

    private HomeForm homeForm;
    private Integer employeeId;
    private LocalDateTime now;

    @BeforeEach
    void setUp() {
        employeeId = 1;
        now = LocalDateTime.of(2025, 7, 10, 10, 30, 0); // 固定の日時を設定
        homeForm = new HomeForm();
        // StampService expects ISO_OFFSET_DATE_TIME format with timezone
        homeForm.setStampTime(now.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) + "+09:00");
    }

    @Test
    void execute_shouldSaveNewAttendanceStamp() {
        homeForm.setStampType(StampType.ATTENDANCE); // 出勤
        homeForm.setNightWorkFlag(AppConstants.Stamp.NIGHT_WORK_FLAG_OFF); // 夜勤ではない

        stampService.execute(homeForm, employeeId);

        ArgumentCaptor<StampHistory> stampHistoryCaptor = ArgumentCaptor.forClass(StampHistory.class);
        verify(mapper, times(1)).save(stampHistoryCaptor.capture());
        StampHistory capturedStamp = stampHistoryCaptor.getValue();

        assertEquals("2025", capturedStamp.getYear());
        assertEquals("07", capturedStamp.getMonth());
        assertEquals("10", capturedStamp.getDay());
        assertEquals(employeeId, capturedStamp.getEmployeeId());
        assertNotNull(capturedStamp.getInTime());
        assertNull(capturedStamp.getOutTime());
        assertEquals(employeeId, capturedStamp.getUpdateEmployeeId());
        assertNotNull(capturedStamp.getUpdateDate());

        verify(logHistoryService, times(1)).execute(
                eq(AppConstants.LogHistory.FUNCTION_STAMP),
                eq(StampType.ATTENDANCE.getLogHistoryOperationType()),
                any(Timestamp.class),
                eq(employeeId),
                eq(employeeId),
                any(Timestamp.class)
        );
    }

    @Test
    void execute_shouldSaveNewLeaveStamp() {
        homeForm.setStampType(StampType.DEPARTURE); // 退勤
        homeForm.setNightWorkFlag(AppConstants.Stamp.NIGHT_WORK_FLAG_OFF); // 夜勤ではない

        stampService.execute(homeForm, employeeId);

        ArgumentCaptor<StampHistory> stampHistoryCaptor = ArgumentCaptor.forClass(StampHistory.class);
        verify(mapper, times(1)).save(stampHistoryCaptor.capture());
        StampHistory capturedStamp = stampHistoryCaptor.getValue();

        assertEquals("2025", capturedStamp.getYear());
        assertEquals("07", capturedStamp.getMonth());
        assertEquals("10", capturedStamp.getDay());
        assertEquals(employeeId, capturedStamp.getEmployeeId());
        assertNull(capturedStamp.getInTime());
        assertNotNull(capturedStamp.getOutTime());
        assertEquals(employeeId, capturedStamp.getUpdateEmployeeId());
        assertNotNull(capturedStamp.getUpdateDate());

        verify(logHistoryService, times(1)).execute(
                eq(AppConstants.LogHistory.FUNCTION_STAMP),
                eq(StampType.DEPARTURE.getLogHistoryOperationType()),
                any(Timestamp.class),
                eq(employeeId),
                eq(employeeId),
                any(Timestamp.class)
        );
    }

    @Test
    void execute_shouldHandleNightWorkLeaveStamp() {
        // 翌日午前2時の退勤を想定
        LocalDateTime nightLeaveTime = LocalDateTime.of(2025, 7, 11, 2, 0, 0);
        // StampService expects ISO_OFFSET_DATE_TIME format with timezone
        homeForm.setStampTime(nightLeaveTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) + "+09:00");
        homeForm.setStampType(StampType.DEPARTURE); // 退勤
        homeForm.setNightWorkFlag(AppConstants.Stamp.NIGHT_WORK_FLAG_ON); // 夜勤

        stampService.execute(homeForm, employeeId);

        ArgumentCaptor<StampHistory> stampHistoryCaptor = ArgumentCaptor.forClass(StampHistory.class);
        verify(mapper, times(1)).save(stampHistoryCaptor.capture());
        StampHistory capturedStamp = stampHistoryCaptor.getValue();

        // 夜勤フラグがONの場合、日付が前日になることを確認
        assertEquals("2025", capturedStamp.getYear());
        assertEquals("07", capturedStamp.getMonth());
        assertEquals("10", capturedStamp.getDay()); // 日付が前日になっていることを確認
        assertEquals(employeeId, capturedStamp.getEmployeeId());
        assertNull(capturedStamp.getInTime());
        assertNotNull(capturedStamp.getOutTime());
        // Convert LocalDateTime to OffsetDateTime for comparison
        OffsetDateTime expectedOutTime = nightLeaveTime.atOffset(ZoneOffset.ofHours(9));
        assertEquals(expectedOutTime, capturedStamp.getOutTime()); // 時刻自体は変わらない
        assertEquals(employeeId, capturedStamp.getUpdateEmployeeId());
        assertNotNull(capturedStamp.getUpdateDate());

        verify(logHistoryService, times(1)).execute(
                eq(AppConstants.LogHistory.FUNCTION_STAMP),
                eq(StampType.DEPARTURE.getLogHistoryOperationType()),
                any(Timestamp.class),
                eq(employeeId),
                eq(employeeId),
                any(Timestamp.class)
        );
    }

    // ON DUPLICATE KEY UPDATE の挙動は、mapper.save が呼び出されることを確認するのみで十分。
    // 実際のDBレベルでの挙動は統合テストの範囲。
    @Test
    void execute_shouldCallSaveEvenIfRecordMightExist() {
        // このテストは、ロジック変更により getStampHistoryByYearMonthDayEmployeeId が呼び出されなくなったことを確認する
        // 以前のロジックでは、ここで mapper.getStampHistoryByYearMonthDayEmployeeId が呼び出されていた
        homeForm.setStampType(StampType.ATTENDANCE); // 出勤
        homeForm.setNightWorkFlag(AppConstants.Stamp.NIGHT_WORK_FLAG_OFF); // 夜勤ではない

        stampService.execute(homeForm, employeeId);

        verify(mapper, times(1)).save(any(StampHistory.class));
        // verify(mapper, never()).getStampHistoryByYearMonthDayEmployeeId(any(), any(), any(), anyInt()); // ロジック変更により不要になった検証
    }

    /**
     * 出勤打刻の重複テスト
     * 既存レコードに inTime が設定済みの場合、DuplicateStampException がスローされることを確認
     */
    @Test
    void execute_shouldThrowException_whenAttendanceAlreadyStamped() {
        // 既存レコードに inTime が設定済み
        StampHistory existing = new StampHistory();
        existing.setId(1);
        existing.setInTime(OffsetDateTime.now().minusHours(1));
        existing.setOutTime(null);

        when(mapper.getStampHistoryByYearMonthDayEmployeeId(any(), any(), any(), anyInt()))
            .thenReturn(existing);

        homeForm.setStampType(StampType.ATTENDANCE);
        homeForm.setNightWorkFlag(AppConstants.Stamp.NIGHT_WORK_FLAG_OFF);

        DuplicateStampException exception = assertThrows(
            DuplicateStampException.class,
            () -> stampService.execute(homeForm, employeeId)
        );

        assertEquals("出勤", exception.getStampType());
        assertNotNull(exception.getExistingTime());
        verify(mapper, never()).update(any());
        verify(mapper, never()).save(any());
    }

    /**
     * 退勤打刻の重複テスト
     * 既存レコードに outTime が設定済みの場合、DuplicateStampException がスローされることを確認
     */
    @Test
    void execute_shouldThrowException_whenDepartureAlreadyStamped() {
        // 既存レコードに outTime が設定済み
        StampHistory existing = new StampHistory();
        existing.setId(1);
        existing.setInTime(OffsetDateTime.now().minusHours(8));
        existing.setOutTime(OffsetDateTime.now().minusHours(1));

        when(mapper.getStampHistoryByYearMonthDayEmployeeId(any(), any(), any(), anyInt()))
            .thenReturn(existing);

        homeForm.setStampType(StampType.DEPARTURE);
        homeForm.setNightWorkFlag(AppConstants.Stamp.NIGHT_WORK_FLAG_OFF);

        DuplicateStampException exception = assertThrows(
            DuplicateStampException.class,
            () -> stampService.execute(homeForm, employeeId)
        );

        assertEquals("退勤", exception.getStampType());
        assertNotNull(exception.getExistingTime());
        verify(mapper, never()).update(any());
        verify(mapper, never()).save(any());
    }

    /**
     * 出勤後の退勤打刻 (正常系)
     * 既存レコードに inTime のみ設定済みの場合、outTime を更新できることを確認
     */
    @Test
    void execute_shouldUpdateOutTime_whenInTimeAlreadyExists() {
        // 既存レコードに inTime のみ設定済み
        OffsetDateTime existingInTime = OffsetDateTime.now().minusHours(8);
        StampHistory existing = new StampHistory();
        existing.setId(1);
        existing.setInTime(existingInTime);
        existing.setOutTime(null);

        when(mapper.getStampHistoryByYearMonthDayEmployeeId(any(), any(), any(), anyInt()))
            .thenReturn(existing);

        homeForm.setStampType(StampType.DEPARTURE);
        homeForm.setNightWorkFlag(AppConstants.Stamp.NIGHT_WORK_FLAG_OFF);

        stampService.execute(homeForm, employeeId);

        ArgumentCaptor<StampHistory> captor = ArgumentCaptor.forClass(StampHistory.class);
        verify(mapper, times(1)).update(captor.capture());

        StampHistory updated = captor.getValue();
        assertNotNull(updated.getInTime()); // 既存の inTime が保持される
        assertNotNull(updated.getOutTime()); // 新しい outTime が設定される
        assertEquals(existingInTime, updated.getInTime());
    }

    /**
     * 退勤後の出勤打刻 (エッジケース)
     * 退勤のみ先に打刻されているケース (通常はありえないが防御的にテスト)
     */
    @Test
    void execute_shouldUpdateInTime_whenOutTimeAlreadyExists() {
        // 退勤のみ先に打刻されているケース
        OffsetDateTime existingOutTime = OffsetDateTime.now().minusHours(1);
        StampHistory existing = new StampHistory();
        existing.setId(1);
        existing.setInTime(null);
        existing.setOutTime(existingOutTime);

        when(mapper.getStampHistoryByYearMonthDayEmployeeId(any(), any(), any(), anyInt()))
            .thenReturn(existing);

        homeForm.setStampType(StampType.ATTENDANCE);
        homeForm.setNightWorkFlag(AppConstants.Stamp.NIGHT_WORK_FLAG_OFF);

        stampService.execute(homeForm, employeeId);

        ArgumentCaptor<StampHistory> captor = ArgumentCaptor.forClass(StampHistory.class);
        verify(mapper, times(1)).update(captor.capture());

        StampHistory updated = captor.getValue();
        assertNotNull(updated.getInTime()); // 新しい inTime が設定される
        assertNotNull(updated.getOutTime()); // 既存の outTime が保持される
        assertEquals(existingOutTime, updated.getOutTime());
    }
}
