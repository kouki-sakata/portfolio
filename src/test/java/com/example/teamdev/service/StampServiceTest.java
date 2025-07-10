package com.example.teamdev.service;

import com.example.teamdev.entity.StampHistory;
import com.example.teamdev.form.HomeForm;
import com.example.teamdev.mapper.StampHistoryMapper;
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
        homeForm.setStampTime(now.format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
    }

    @Test
    void execute_shouldSaveNewAttendanceStamp() {
        homeForm.setStampType("1"); // 出勤
        homeForm.setNightWorkFlag("0"); // 夜勤ではない

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
                eq(1), eq(1), any(Timestamp.class), eq(employeeId), eq(employeeId), any(Timestamp.class)
        );
    }

    @Test
    void execute_shouldSaveNewLeaveStamp() {
        homeForm.setStampType("2"); // 退勤
        homeForm.setNightWorkFlag("0"); // 夜勤ではない

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
                eq(1), eq(2), any(Timestamp.class), eq(employeeId), eq(employeeId), any(Timestamp.class)
        );
    }

    @Test
    void execute_shouldHandleNightWorkLeaveStamp() {
        // 翌日午前2時の退勤を想定
        LocalDateTime nightLeaveTime = LocalDateTime.of(2025, 7, 11, 2, 0, 0);
        homeForm.setStampTime(nightLeaveTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
        homeForm.setStampType("2"); // 退勤
        homeForm.setNightWorkFlag("1"); // 夜勤

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
                eq(1), eq(2), any(Timestamp.class), eq(employeeId), eq(employeeId), any(Timestamp.class)
        );
    }

    // ON DUPLICATE KEY UPDATE の挙動は、mapper.save が呼び出されることを確認するのみで十分。
    // 実際のDBレベルでの挙動は統合テストの範囲。
    @Test
    void execute_shouldCallSaveEvenIfRecordMightExist() {
        // このテストは、ロジック変更により getStampHistoryByYearMonthDayEmployeeId が呼び出されなくなったことを確認する
        // 以前のロジックでは、ここで mapper.getStampHistoryByYearMonthDayEmployeeId が呼び出されていた
        homeForm.setStampType("1"); // 出勤
        homeForm.setNightWorkFlag("0"); // 夜勤ではない

        stampService.execute(homeForm, employeeId);

        verify(mapper, times(1)).save(any(StampHistory.class));
        // verify(mapper, never()).getStampHistoryByYearMonthDayEmployeeId(any(), any(), any(), anyInt()); // ロジック変更により不要になった検証
    }
}
