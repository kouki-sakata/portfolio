package com.example.teamdev.service;

import com.example.teamdev.entity.StampHistoryDisplay;
import com.example.teamdev.mapper.StampHistoryMapper;
import com.example.teamdev.service.profile.ProfileMetadataRepository;
import com.example.teamdev.service.profile.model.ProfileMetadataDocument;
import com.example.teamdev.service.profile.model.ProfileWorkScheduleDocument;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * StampHistoryServiceのテストクラス
 */
@ExtendWith(MockitoExtension.class)
class StampHistoryServiceTest {

    @Mock
    private StampHistoryMapper mapper;

    @Mock
    private ProfileMetadataRepository profileMetadataRepository;

    @Mock
    private ObjectMapper objectMapper;

    private StampHistoryService service;

    private ProfileMetadataDocument defaultMetadata;
    private Clock clock;

    @BeforeEach
    void setUp() {
        // 固定の時刻を設定（2024年1月15日）
        Instant fixedInstant = Instant.parse("2024-01-15T12:00:00Z");
        clock = Clock.fixed(fixedInstant, ZoneId.systemDefault());

        // サービスを手動で作成
        service = new StampHistoryService(mapper, objectMapper, profileMetadataRepository, clock);

        // デフォルトのProfileMetadataを準備
        ProfileWorkScheduleDocument schedule = new ProfileWorkScheduleDocument(
            "09:00",
            "18:00",
            60
        );
        defaultMetadata = new ProfileMetadataDocument(schedule);
    }

    // ========================================
    // execute() - 正常系
    // ========================================

    @Test
    void execute_正常に打刻記録を取得できる() {
        // Given
        String year = "2024";
        String month = "01";
        int employeeId = 1;

        List<StampHistoryDisplay> mockData = createMockStampHistoryList();
        when(mapper.getStampHistoryByYearMonthEmployeeId(
            eq(year),
            eq(month),
            eq(employeeId),
            anyList()
        )).thenReturn(mockData);
        when(profileMetadataRepository.load(employeeId)).thenReturn(defaultMetadata);

        try (MockedStatic<OvertimeCalculator> mockedCalculator = mockStatic(OvertimeCalculator.class)) {
            mockedCalculator.when(() ->
                OvertimeCalculator.calculateOvertimeMinutes(any(), any())
            ).thenReturn(60);

            // When
            List<Map<String, Object>> result = service.execute(year, month, employeeId);

            // Then
            assertNotNull(result);
            assertEquals(31, result.size()); // 1月は31日

            // 最初の要素を検証
            Map<String, Object> firstEntry = result.get(0);
            assertNotNull(firstEntry);

            // 生のタイムスタンプフィールドが除外されていることを確認
            assertFalse(firstEntry.containsKey("inTimeRaw"));
            assertFalse(firstEntry.containsKey("outTimeRaw"));
            assertFalse(firstEntry.containsKey("breakStartTimeRaw"));
            assertFalse(firstEntry.containsKey("breakEndTimeRaw"));

            verify(mapper).getStampHistoryByYearMonthEmployeeId(
                eq(year),
                eq(month),
                eq(employeeId),
                anyList()
            );
            verify(profileMetadataRepository).load(employeeId);
        }
    }

    @Test
    void execute_残業時間が正しく計算される() {
        // Given
        String year = "2024";
        String month = "01";
        int employeeId = 1;

        StampHistoryDisplay display = createStampHistoryDisplay(
            1, "2024", "01", "01", "月"
        );

        when(mapper.getStampHistoryByYearMonthEmployeeId(anyString(), anyString(), anyInt(), anyList()))
            .thenReturn(List.of(display));
        when(profileMetadataRepository.load(employeeId)).thenReturn(defaultMetadata);

        try (MockedStatic<OvertimeCalculator> mockedCalculator = mockStatic(OvertimeCalculator.class)) {
            mockedCalculator.when(() ->
                OvertimeCalculator.calculateOvertimeMinutes(any(), any())
            ).thenReturn(120); // 2時間の残業

            // When
            List<Map<String, Object>> result = service.execute(year, month, employeeId);

            // Then
            Map<String, Object> firstEntry = result.get(0);
            assertEquals(120, firstEntry.get("overtimeMinutes"));

            mockedCalculator.verify(() ->
                OvertimeCalculator.calculateOvertimeMinutes(any(), eq(defaultMetadata.schedule())),
                times(1)
            );
        }
    }

    @Test
    void execute_閏年の2月を正しく処理できる() {
        // Given: 2024年は閏年
        String year = "2024";
        String month = "02";
        int employeeId = 1;

        when(mapper.getStampHistoryByYearMonthEmployeeId(anyString(), anyString(), anyInt(), anyList()))
            .thenReturn(new ArrayList<>());
        when(profileMetadataRepository.load(employeeId)).thenReturn(defaultMetadata);

        try (MockedStatic<OvertimeCalculator> mockedCalculator = mockStatic(OvertimeCalculator.class)) {
            mockedCalculator.when(() ->
                OvertimeCalculator.calculateOvertimeMinutes(any(), any())
            ).thenReturn(0);

            // When
            List<Map<String, Object>> result = service.execute(year, month, employeeId);

            // Then: 2024年2月は29日まで
            assertEquals(29, result.size());
        }
    }

    @Test
    void execute_平年の2月を正しく処理できる() {
        // Given: 2023年は平年
        String year = "2023";
        String month = "02";
        int employeeId = 1;

        when(mapper.getStampHistoryByYearMonthEmployeeId(anyString(), anyString(), anyInt(), anyList()))
            .thenReturn(new ArrayList<>());
        when(profileMetadataRepository.load(employeeId)).thenReturn(defaultMetadata);

        try (MockedStatic<OvertimeCalculator> mockedCalculator = mockStatic(OvertimeCalculator.class)) {
            mockedCalculator.when(() ->
                OvertimeCalculator.calculateOvertimeMinutes(any(), any())
            ).thenReturn(0);

            // When
            List<Map<String, Object>> result = service.execute(year, month, employeeId);

            // Then: 2023年2月は28日まで
            assertEquals(28, result.size());
        }
    }

    @Test
    void execute_打刻記録がない日も含めて全日付を返す() {
        // Given: 一部の日付にのみ打刻記録がある
        String year = "2024";
        String month = "01";
        int employeeId = 1;

        // 1日、15日、31日のみデータがある
        List<StampHistoryDisplay> mockData = List.of(
            createStampHistoryDisplay(1, "2024", "01", "01", "月"),
            createStampHistoryDisplay(15, "2024", "01", "15", "月"),
            createStampHistoryDisplay(31, "2024", "01", "31", "水")
        );

        when(mapper.getStampHistoryByYearMonthEmployeeId(anyString(), anyString(), anyInt(), anyList()))
            .thenReturn(mockData);
        when(profileMetadataRepository.load(employeeId)).thenReturn(defaultMetadata);

        try (MockedStatic<OvertimeCalculator> mockedCalculator = mockStatic(OvertimeCalculator.class)) {
            mockedCalculator.when(() ->
                OvertimeCalculator.calculateOvertimeMinutes(any(), any())
            ).thenReturn(0);

            // When
            List<Map<String, Object>> result = service.execute(year, month, employeeId);

            // Then: 月の全日付（31日分）がカバーされる
            assertEquals(31, result.size());
        }
    }

    @Test
    void execute_生のタイムスタンプフィールドがMapから除外される() {
        // Given
        String year = "2024";
        String month = "01";
        int employeeId = 1;

        StampHistoryDisplay display = createStampHistoryDisplay(1, "2024", "01", "01", "月");
        display.setInTimeRaw(OffsetDateTime.now());
        display.setOutTimeRaw(OffsetDateTime.now());
        display.setBreakStartTimeRaw(OffsetDateTime.now());
        display.setBreakEndTimeRaw(OffsetDateTime.now());

        when(mapper.getStampHistoryByYearMonthEmployeeId(anyString(), anyString(), anyInt(), anyList()))
            .thenReturn(List.of(display));
        when(profileMetadataRepository.load(employeeId)).thenReturn(defaultMetadata);

        try (MockedStatic<OvertimeCalculator> mockedCalculator = mockStatic(OvertimeCalculator.class)) {
            mockedCalculator.when(() ->
                OvertimeCalculator.calculateOvertimeMinutes(any(), any())
            ).thenReturn(0);

            // When
            List<Map<String, Object>> result = service.execute(year, month, employeeId);

            // Then
            Map<String, Object> firstEntry = result.get(0);
            assertFalse(firstEntry.containsKey("inTimeRaw"));
            assertFalse(firstEntry.containsKey("outTimeRaw"));
            assertFalse(firstEntry.containsKey("breakStartTimeRaw"));
            assertFalse(firstEntry.containsKey("breakEndTimeRaw"));
        }
    }

    // ========================================
    // execute() - 異常系
    // ========================================

    @Test
    void execute_不正な年月フォーマットで例外が発生する() {
        // Given
        String year = "ABCD";
        String month = "XY";
        int employeeId = 1;

        // When & Then
        assertThrows(NumberFormatException.class, () -> {
            service.execute(year, month, employeeId);
        });
    }

    @Test
    void execute_存在しない月で例外が発生する() {
        // Given
        String year = "2024";
        String month = "13"; // 13月は存在しない
        int employeeId = 1;

        // When & Then
        assertThrows(DateTimeException.class, () -> {
            service.execute(year, month, employeeId);
        });
    }

    // ========================================
    // getYearList() のテスト
    // ========================================

    @Test
    void getYearList_現在年の前後1年を返す() {
        // When
        List<String> result = service.getYearList();

        // Then
        assertNotNull(result);
        assertEquals(3, result.size());

        // Clockで固定された年（2024年）を基準に検証
        assertEquals("2023", result.get(0)); // 2024 - 1
        assertEquals("2024", result.get(1)); // 2024
        assertEquals("2025", result.get(2)); // 2024 + 1
    }

    // ========================================
    // getMonthList() のテスト
    // ========================================

    @Test
    void getMonthList_01から12までゼロ埋めで返す() {
        // When
        List<String> result = service.getMonthList();

        // Then
        assertNotNull(result);
        assertEquals(12, result.size());

        assertEquals("01", result.get(0));
        assertEquals("02", result.get(1));
        assertEquals("03", result.get(2));
        assertEquals("04", result.get(3));
        assertEquals("05", result.get(4));
        assertEquals("06", result.get(5));
        assertEquals("07", result.get(6));
        assertEquals("08", result.get(7));
        assertEquals("09", result.get(8));
        assertEquals("10", result.get(9));
        assertEquals("11", result.get(10));
        assertEquals("12", result.get(11));
    }

    // ========================================
    // ヘルパーメソッド
    // ========================================

    private StampHistoryDisplay createStampHistoryDisplay(
        int id, String year, String month, String day, String dayOfWeek) {
        StampHistoryDisplay display = new StampHistoryDisplay();
        display.setId(id);
        display.setYear(year);
        display.setMonth(month);
        display.setDay(day);
        display.setDayOfWeek(dayOfWeek);

        // タイムスタンプを設定
        LocalDateTime dateTime = LocalDateTime.of(2024, 1, 1, 9, 0);
        OffsetDateTime offsetDateTime = OffsetDateTime.of(dateTime, ZoneOffset.UTC);

        display.setInTimeRaw(offsetDateTime);
        display.setOutTimeRaw(offsetDateTime.plusHours(9));
        display.setInTime("09:00");
        display.setOutTime("18:00");

        return display;
    }

    private List<StampHistoryDisplay> createMockStampHistoryList() {
        List<StampHistoryDisplay> list = new ArrayList<>();
        // 1月の31日分のデータを作成
        for (int day = 1; day <= 31; day++) {
            list.add(createStampHistoryDisplay(
                day,
                "2024",
                "01",
                String.format("%02d", day),
                "月"
            ));
        }
        return list;
    }
}
