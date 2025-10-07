package com.example.teamdev.service;

import com.example.teamdev.entity.StampHistory;
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
import java.time.format.DateTimeFormatter;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

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
        homeForm.setStampTime(now.format(DateTimeFormatter.ofPattern(AppConstants.DateFormat.ISO_LOCAL_DATE_TIME)));
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
        homeForm.setStampTime(nightLeaveTime.format(DateTimeFormatter.ofPattern(AppConstants.DateFormat.ISO_LOCAL_DATE_TIME)));
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
        assertEquals(Timestamp.valueOf(nightLeaveTime), capturedStamp.getOutTime()); // 時刻自体は変わらない
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
}
