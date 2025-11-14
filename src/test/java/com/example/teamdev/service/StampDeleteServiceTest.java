package com.example.teamdev.service;

import com.example.teamdev.entity.StampHistory;
import com.example.teamdev.form.StampDeleteForm;
import com.example.teamdev.mapper.StampDeleteMapper;
import com.example.teamdev.mapper.StampHistoryMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * StampDeleteServiceのテストクラス
 */
@ExtendWith(MockitoExtension.class)
class StampDeleteServiceTest {

    @Mock
    private StampDeleteMapper stampDeleteMapper;

    @Mock
    private StampHistoryMapper stampHistoryMapper;

    @Mock
    private LogHistoryRegistrationService logHistoryService;

    private Clock clock;
    private StampDeleteService service;

    private static final Instant FIXED_INSTANT = Instant.parse("2024-01-15T10:30:00Z");

    @BeforeEach
    void setUp() {
        // テスト用の固定Clock
        clock = Clock.fixed(FIXED_INSTANT, ZoneId.systemDefault());
        service = new StampDeleteService(
            stampDeleteMapper,
            stampHistoryMapper,
            logHistoryService,
            clock
        );
    }

    // ========================================
    // deleteStampsByYearMonthRange() - 正常系
    // ========================================

    @Test
    void deleteStampsByYearMonthRange_正常に削除できる() {
        // Given
        StampDeleteForm form = new StampDeleteForm();
        form.setStartYear("2024");
        form.setStartMonth("01");
        form.setEndYear("2024");
        form.setEndMonth("03");
        Integer updateEmployeeId = 1;

        when(stampDeleteMapper.deleteStampsByYearMonthRange(any())).thenReturn(5);

        // When
        int result = service.deleteStampsByYearMonthRange(form, updateEmployeeId);

        // Then
        assertEquals(5, result);
        verify(stampDeleteMapper).deleteStampsByYearMonthRange(any());
        verify(logHistoryService).execute(
            eq(5),
            eq(4),
            isNull(),
            isNull(),
            eq(updateEmployeeId),
            any(Timestamp.class)
        );
    }

    @Test
    void deleteStampsByYearMonthRange_削除成功時のみログが記録される() {
        // Given
        StampDeleteForm form = createForm("2024", "01", "2024", "12");
        Integer updateEmployeeId = 1;

        when(stampDeleteMapper.deleteStampsByYearMonthRange(any())).thenReturn(10);

        // When
        service.deleteStampsByYearMonthRange(form, updateEmployeeId);

        // Then
        verify(logHistoryService, times(1)).execute(
            anyInt(),
            anyInt(),
            isNull(),
            isNull(),
            eq(updateEmployeeId),
            any(Timestamp.class)
        );
    }

    @Test
    void deleteStampsByYearMonthRange_削除件数が0でもログは記録される() {
        // Given
        StampDeleteForm form = createForm("2024", "01", "2024", "03");
        Integer updateEmployeeId = 1;

        when(stampDeleteMapper.deleteStampsByYearMonthRange(any())).thenReturn(0);

        // When
        int result = service.deleteStampsByYearMonthRange(form, updateEmployeeId);

        // Then
        assertEquals(0, result);
        verify(logHistoryService).execute(
            anyInt(),
            anyInt(),
            isNull(),
            isNull(),
            eq(updateEmployeeId),
            any(Timestamp.class)
        );
    }

    @Test
    void deleteStampsByYearMonthRange_固定時刻でログが記録される() {
        // Given
        StampDeleteForm form = createForm("2024", "01", "2024", "03");
        Integer updateEmployeeId = 1;

        when(stampDeleteMapper.deleteStampsByYearMonthRange(any())).thenReturn(3);

        ArgumentCaptor<Timestamp> timestampCaptor = ArgumentCaptor.forClass(Timestamp.class);

        // When
        service.deleteStampsByYearMonthRange(form, updateEmployeeId);

        // Then
        verify(logHistoryService).execute(
            anyInt(),
            anyInt(),
            isNull(),
            isNull(),
            eq(updateEmployeeId),
            timestampCaptor.capture()
        );

        Timestamp capturedTimestamp = timestampCaptor.getValue();
        assertEquals(Timestamp.from(FIXED_INSTANT), capturedTimestamp);
    }

    // ========================================
    // validateYearMonthRange() - 正常系
    // ========================================

    @Test
    void validateYearMonthRange_有効な範囲でtrueを返す() {
        // Given
        StampDeleteForm form = createForm("2024", "01", "2024", "12");

        // When
        boolean result = service.validateYearMonthRange(form);

        // Then
        assertTrue(result);
    }

    @Test
    void validateYearMonthRange_同じ年月でtrueを返す() {
        // Given
        StampDeleteForm form = createForm("2024", "06", "2024", "06");

        // When
        boolean result = service.validateYearMonthRange(form);

        // Then
        assertTrue(result);
    }

    @Test
    void validateYearMonthRange_年をまたぐ範囲でtrueを返す() {
        // Given
        StampDeleteForm form = createForm("2023", "12", "2024", "01");

        // When
        boolean result = service.validateYearMonthRange(form);

        // Then
        assertTrue(result);
    }

    @Test
    void validateYearMonthRange_複数年をまたぐ範囲でtrueを返す() {
        // Given
        StampDeleteForm form = createForm("2022", "01", "2024", "12");

        // When
        boolean result = service.validateYearMonthRange(form);

        // Then
        assertTrue(result);
    }

    // ========================================
    // validateYearMonthRange() - 異常系
    // ========================================

    @Test
    void validateYearMonthRange_開始が終了より後の場合falseを返す() {
        // Given
        StampDeleteForm form = createForm("2024", "12", "2024", "01");

        // When
        boolean result = service.validateYearMonthRange(form);

        // Then
        assertFalse(result);
    }

    @Test
    void validateYearMonthRange_開始年が終了年より後の場合falseを返す() {
        // Given
        StampDeleteForm form = createForm("2025", "01", "2024", "12");

        // When
        boolean result = service.validateYearMonthRange(form);

        // Then
        assertFalse(result);
    }

    @Test
    void validateYearMonthRange_不正なフォーマットでfalseを返す() {
        // Given
        StampDeleteForm form = new StampDeleteForm();
        form.setStartYear("2024");
        form.setStartMonth("abc");
        form.setEndYear("2024");
        form.setEndMonth("12");

        // When
        boolean result = service.validateYearMonthRange(form);

        // Then
        assertFalse(result);
    }

    @Test
    void validateYearMonthRange_空文字でfalseを返す() {
        // Given
        StampDeleteForm form = new StampDeleteForm();
        form.setStartYear("");
        form.setStartMonth("");
        form.setEndYear("");
        form.setEndMonth("");

        // When
        boolean result = service.validateYearMonthRange(form);

        // Then
        assertFalse(result);
    }

    @Test
    void validateYearMonthRange_月のゼロパディングが正しく処理される() {
        // Given: 月が "1" と "10" （ゼロパディングなし）
        StampDeleteForm form = new StampDeleteForm();
        form.setStartYear("2024");
        form.setStartMonth("1");  // ゼロパディングなし
        form.setEndYear("2024");
        form.setEndMonth("10");

        // When
        boolean result = service.validateYearMonthRange(form);

        // Then: 内部で "01" と "10" に変換されて正しく比較される
        assertTrue(result);
    }

    @Test
    void validateYearMonthRange_月が13以上の場合falseを返す() {
        // Given
        StampDeleteForm form = createForm("2024", "13", "2024", "14");

        // When
        boolean result = service.validateYearMonthRange(form);

        // Then: 月は1-12の範囲でなければならないため、falseを返す
        assertFalse(result);
    }

    @Test
    void validateYearMonthRange_月が0以下の場合falseを返す() {
        // Given
        StampDeleteForm form = createForm("2024", "0", "2024", "1");

        // When
        boolean result = service.validateYearMonthRange(form);

        // Then: 月は1-12の範囲でなければならないため、falseを返す
        assertFalse(result);
    }

    @Test
    void validateYearMonthRange_開始月のみ範囲外の場合falseを返す() {
        // Given
        StampDeleteForm form = createForm("2024", "15", "2024", "12");

        // When
        boolean result = service.validateYearMonthRange(form);

        // Then
        assertFalse(result);
    }

    @Test
    void validateYearMonthRange_終了月のみ範囲外の場合falseを返す() {
        // Given
        StampDeleteForm form = createForm("2024", "1", "2024", "13");

        // When
        boolean result = service.validateYearMonthRange(form);

        // Then
        assertFalse(result);
    }

    // ========================================
    // deleteStampById() - 正常系
    // ========================================

    @Test
    void deleteStampById_正常に削除できる() {
        // Given
        Integer stampId = 123;
        Integer updateEmployeeId = 1;

        StampHistory stampHistory = new StampHistory();
        stampHistory.setId(stampId);
        stampHistory.setEmployeeId(10);

        when(stampHistoryMapper.getById(stampId)).thenReturn(Optional.of(stampHistory));
        when(stampHistoryMapper.deleteById(stampId)).thenReturn(1);

        // When
        boolean result = service.deleteStampById(stampId, updateEmployeeId);

        // Then
        assertTrue(result);
        verify(stampHistoryMapper).getById(stampId);
        verify(stampHistoryMapper).deleteById(stampId);
        verify(logHistoryService).execute(
            eq(5),
            eq(4),
            isNull(),
            eq(10),
            eq(updateEmployeeId),
            any(Timestamp.class)
        );
    }

    @Test
    void deleteStampById_存在しないIDでfalseを返す() {
        // Given
        Integer stampId = 999;
        Integer updateEmployeeId = 1;

        when(stampHistoryMapper.getById(stampId)).thenReturn(Optional.empty());

        // When
        boolean result = service.deleteStampById(stampId, updateEmployeeId);

        // Then
        assertFalse(result);
        verify(stampHistoryMapper).getById(stampId);
        verify(stampHistoryMapper, never()).deleteById(anyInt());
        verify(logHistoryService, never()).execute(
            anyInt(),
            anyInt(),
            any(),
            any(),
            anyInt(),
            any(Timestamp.class)
        );
    }

    @Test
    void deleteStampById_削除が0件の場合falseを返す() {
        // Given
        Integer stampId = 123;
        Integer updateEmployeeId = 1;

        StampHistory stampHistory = new StampHistory();
        stampHistory.setId(stampId);
        stampHistory.setEmployeeId(10);

        when(stampHistoryMapper.getById(stampId)).thenReturn(Optional.of(stampHistory));
        when(stampHistoryMapper.deleteById(stampId)).thenReturn(0); // 削除失敗

        // When
        boolean result = service.deleteStampById(stampId, updateEmployeeId);

        // Then
        assertFalse(result);
        verify(stampHistoryMapper).deleteById(stampId);
        verify(logHistoryService, never()).execute(
            anyInt(),
            anyInt(),
            any(),
            any(),
            anyInt(),
            any(Timestamp.class)
        );
    }

    // ========================================
    // deleteStampById() - 異常系
    // ========================================

    @Test
    void deleteStampById_nullのIDで例外を投げる() {
        // Given
        Integer stampId = null;
        Integer updateEmployeeId = 1;

        // When & Then
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> service.deleteStampById(stampId, updateEmployeeId)
        );

        assertEquals("stampId must not be null", exception.getMessage());
        verify(stampHistoryMapper, never()).getById(any());
        verify(stampHistoryMapper, never()).deleteById(any());
        verify(logHistoryService, never()).execute(
            anyInt(),
            anyInt(),
            any(),
            any(),
            anyInt(),
            any(Timestamp.class)
        );
    }

    // ========================================
    // ヘルパーメソッド
    // ========================================

    private StampDeleteForm createForm(String startYear, String startMonth,
                                       String endYear, String endMonth) {
        StampDeleteForm form = new StampDeleteForm();
        form.setStartYear(startYear);
        form.setStartMonth(startMonth);
        form.setEndYear(endYear);
        form.setEndMonth(endMonth);
        return form;
    }
}
