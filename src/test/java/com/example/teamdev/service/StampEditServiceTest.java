package com.example.teamdev.service;

import com.example.teamdev.dto.StampEditData;
import com.example.teamdev.service.stamp.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * StampEditServiceのテストクラス。
 * 5つの専門クラスをモック化して統合テストシナリオを実装します。
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("StampEditService テスト")
class StampEditServiceTest {

    @Mock
    private StampFormDataExtractor dataExtractor;

    @Mock
    private OutTimeAdjuster outTimeAdjuster;

    @Mock
    private StampHistoryPersistence stampPersistence;

    @Mock
    private LogHistoryRegistrationService logHistoryService;

    @InjectMocks
    private StampEditService stampEditService;

    private static final int UPDATE_EMPLOYEE_ID = 100;
    private OffsetDateTime testInTime;
    private OffsetDateTime testOutTime;
    private OffsetDateTime adjustedOutTime;

    @BeforeEach
    void setUp() {
        testInTime = OffsetDateTime.of(2025, 10, 1, 9, 0, 0, 0, ZoneOffset.ofHours(9));
        testOutTime = OffsetDateTime.of(2025, 10, 1, 18, 0, 0, 0, ZoneOffset.ofHours(9));
        adjustedOutTime = OffsetDateTime.of(2025, 10, 2, 6, 0, 0, 0, ZoneOffset.ofHours(9));
    }

    @Nested
    @DisplayName("execute メソッド - 基本シナリオ")
    class ExecuteBasicScenarioTest {

        @Test
        @DisplayName("正常系: 単一の打刻データが正しく処理される")
        void execute_withSingleStampData_shouldProcessCorrectly() {
            // Arrange
            Map<String, Object> stampEdit = createStampEditMap("100", "2025", "10", "1", "09:00", "18:00", null);
            List<Map<String, Object>> stampEditList = List.of(stampEdit);

            StampEditData extractedData = new StampEditData(null, 100, "2025", "10", "1", "09:00", "18:00");

            when(dataExtractor.extractFromMap(stampEdit)).thenReturn(extractedData);
            when(outTimeAdjuster.adjustOutTimeIfNeeded(any(), any())).thenReturn(testOutTime);
            when(stampPersistence.saveOrUpdate(eq(extractedData), any(), any(), eq(UPDATE_EMPLOYEE_ID)))
                .thenReturn(true);

            // Act
            stampEditService.execute(stampEditList, UPDATE_EMPLOYEE_ID);

            // Assert
            verify(dataExtractor).extractFromMap(stampEdit);
            verify(outTimeAdjuster).adjustOutTimeIfNeeded(any(), any());
            verify(stampPersistence).saveOrUpdate(eq(extractedData), any(), any(), eq(UPDATE_EMPLOYEE_ID));
            verify(logHistoryService).execute(eq(4), eq(3), isNull(), eq(100), eq(UPDATE_EMPLOYEE_ID), any());
        }

        @Test
        @DisplayName("正常系: 複数の打刻データが順次処理される")
        void execute_withMultipleStampData_shouldProcessSequentially() {
            // Arrange
            Map<String, Object> stamp1 = createStampEditMap("100", "2025", "10", "1", "09:00", "18:00", null);
            Map<String, Object> stamp2 = createStampEditMap("100", "2025", "10", "2", "10:00", "19:00", null);
            List<Map<String, Object>> stampEditList = List.of(stamp1, stamp2);

            StampEditData data1 = new StampEditData(null, 100, "2025", "10", "1", "09:00", "18:00");
            StampEditData data2 = new StampEditData(null, 100, "2025", "10", "2", "10:00", "19:00");

            when(dataExtractor.extractFromMap(stamp1)).thenReturn(data1);
            when(dataExtractor.extractFromMap(stamp2)).thenReturn(data2);
            when(outTimeAdjuster.adjustOutTimeIfNeeded(any(), any())).thenReturn(testOutTime);
            when(stampPersistence.saveOrUpdate(any(), any(), any(), anyInt())).thenReturn(true);

            // Act
            stampEditService.execute(stampEditList, UPDATE_EMPLOYEE_ID);

            // Assert
            verify(dataExtractor, times(2)).extractFromMap(any());
            verify(outTimeAdjuster, times(2)).adjustOutTimeIfNeeded(any(), any());
            verify(stampPersistence, times(2)).saveOrUpdate(any(), any(), any(), anyInt());
            verify(logHistoryService, times(1)).execute(anyInt(), anyInt(), isNull(), anyInt(), anyInt(), any());
        }

        @Test
        @DisplayName("正常系: 保存が行われた場合のみログ履歴が記録される")
        void execute_withSaveSuccess_shouldRecordLogHistory() {
            // Arrange
            Map<String, Object> stampEdit = createStampEditMap("200", "2025", "10", "5", "08:00", "17:00", null);
            List<Map<String, Object>> stampEditList = List.of(stampEdit);

            StampEditData data = new StampEditData(null, 200, "2025", "10", "5", "08:00", "17:00");

            when(dataExtractor.extractFromMap(any())).thenReturn(data);
            when(outTimeAdjuster.adjustOutTimeIfNeeded(any(), any())).thenReturn(testOutTime);
            when(stampPersistence.saveOrUpdate(any(), any(), any(), anyInt())).thenReturn(true);

            // Act
            stampEditService.execute(stampEditList, UPDATE_EMPLOYEE_ID);

            // Assert
            verify(logHistoryService).execute(eq(4), eq(3), isNull(), eq(200), eq(UPDATE_EMPLOYEE_ID), any());
        }

        @Test
        @DisplayName("正常系: 保存が失敗した場合ログ履歴は記録されない")
        void execute_withSaveFailure_shouldNotRecordLogHistory() {
            // Arrange
            Map<String, Object> stampEdit = createStampEditMap("300", "2025", "10", "10", "09:00", "18:00", null);
            List<Map<String, Object>> stampEditList = List.of(stampEdit);

            StampEditData data = new StampEditData(999, 300, "2025", "10", "10", "09:00", "18:00");

            when(dataExtractor.extractFromMap(any())).thenReturn(data);
            when(outTimeAdjuster.adjustOutTimeIfNeeded(any(), any())).thenReturn(testOutTime);
            when(stampPersistence.saveOrUpdate(any(), any(), any(), anyInt())).thenReturn(false);

            // Act
            stampEditService.execute(stampEditList, UPDATE_EMPLOYEE_ID);

            // Assert
            verify(logHistoryService, never()).execute(anyInt(), anyInt(), any(), anyInt(), anyInt(), any());
        }
    }

    @Nested
    @DisplayName("execute メソッド - 時刻変換シナリオ")
    class ExecuteTimeConversionScenarioTest {

        @Test
        @DisplayName("正常系: 出勤時刻のみのデータが正しく処理される")
        void execute_withInTimeOnly_shouldProcessCorrectly() {
            // Arrange
            Map<String, Object> stampEdit = createStampEditMap("100", "2025", "10", "1", "09:00", null, null);
            List<Map<String, Object>> stampEditList = List.of(stampEdit);

            StampEditData data = new StampEditData(null, 100, "2025", "10", "1", "09:00", null);

            when(dataExtractor.extractFromMap(any())).thenReturn(data);
            when(outTimeAdjuster.adjustOutTimeIfNeeded(any(), isNull())).thenReturn(null);
            when(stampPersistence.saveOrUpdate(eq(data), any(), isNull(), eq(UPDATE_EMPLOYEE_ID))).thenReturn(true);

            // Act
            stampEditService.execute(stampEditList, UPDATE_EMPLOYEE_ID);

            // Assert
            verify(stampPersistence).saveOrUpdate(eq(data), any(), isNull(), eq(UPDATE_EMPLOYEE_ID));
        }

        @Test
        @DisplayName("正常系: 退勤時刻のみのデータが正しく処理される")
        void execute_withOutTimeOnly_shouldProcessCorrectly() {
            // Arrange
            Map<String, Object> stampEdit = createStampEditMap("150", "2025", "10", "2", null, "18:00", null);
            List<Map<String, Object>> stampEditList = List.of(stampEdit);

            StampEditData data = new StampEditData(null, 150, "2025", "10", "2", null, "18:00");

            when(dataExtractor.extractFromMap(any())).thenReturn(data);
            when(outTimeAdjuster.adjustOutTimeIfNeeded(isNull(), any())).thenReturn(testOutTime);
            when(stampPersistence.saveOrUpdate(eq(data), isNull(), any(), eq(UPDATE_EMPLOYEE_ID))).thenReturn(true);

            // Act
            stampEditService.execute(stampEditList, UPDATE_EMPLOYEE_ID);

            // Assert
            verify(stampPersistence).saveOrUpdate(eq(data), isNull(), any(), eq(UPDATE_EMPLOYEE_ID));
        }

        @Test
        @DisplayName("正常系: 時刻が両方nullのデータが正しく処理される")
        void execute_withBothTimesNull_shouldProcessCorrectly() {
            // Arrange
            Map<String, Object> stampEdit = createStampEditMap("200", "2025", "10", "3", null, null, null);
            List<Map<String, Object>> stampEditList = List.of(stampEdit);

            StampEditData data = new StampEditData(null, 200, "2025", "10", "3", null, null);

            when(dataExtractor.extractFromMap(any())).thenReturn(data);
            when(outTimeAdjuster.adjustOutTimeIfNeeded(isNull(), isNull())).thenReturn(null);
            when(stampPersistence.saveOrUpdate(eq(data), isNull(), isNull(), eq(UPDATE_EMPLOYEE_ID))).thenReturn(true);

            // Act
            stampEditService.execute(stampEditList, UPDATE_EMPLOYEE_ID);

            // Assert
            verify(stampPersistence).saveOrUpdate(eq(data), isNull(), isNull(), eq(UPDATE_EMPLOYEE_ID));
        }
    }

    @Nested
    @DisplayName("execute メソッド - 日跨ぎシナリオ")
    class ExecuteOvernightShiftScenarioTest {

        @Test
        @DisplayName("正常系: 夜勤シフトで退勤時刻が翌日に調整される")
        void execute_withNightShift_shouldAdjustOutTime() {
            // Arrange
            Map<String, Object> stampEdit = createStampEditMap("100", "2025", "10", "1", "22:00", "06:00", null);
            List<Map<String, Object>> stampEditList = List.of(stampEdit);

            StampEditData data = new StampEditData(null, 100, "2025", "10", "1", "22:00", "06:00");

            when(dataExtractor.extractFromMap(any())).thenReturn(data);
            when(outTimeAdjuster.adjustOutTimeIfNeeded(any(), any())).thenReturn(adjustedOutTime);
            when(stampPersistence.saveOrUpdate(eq(data), any(), any(), eq(UPDATE_EMPLOYEE_ID)))
                .thenReturn(true);

            // Act
            stampEditService.execute(stampEditList, UPDATE_EMPLOYEE_ID);

            // Assert
            verify(outTimeAdjuster).adjustOutTimeIfNeeded(any(), any());
            verify(stampPersistence).saveOrUpdate(eq(data), any(), any(), eq(UPDATE_EMPLOYEE_ID));
        }

        @Test
        @DisplayName("正常系: 通常勤務では退勤時刻が調整されない")
        void execute_withNormalShift_shouldNotAdjustOutTime() {
            // Arrange
            Map<String, Object> stampEdit = createStampEditMap("100", "2025", "10", "5", "09:00", "18:00", null);
            List<Map<String, Object>> stampEditList = List.of(stampEdit);

            StampEditData data = new StampEditData(null, 100, "2025", "10", "5", "09:00", "18:00");

            when(dataExtractor.extractFromMap(any())).thenReturn(data);
            when(outTimeAdjuster.adjustOutTimeIfNeeded(any(), any())).thenReturn(testOutTime);
            when(stampPersistence.saveOrUpdate(eq(data), any(), any(), eq(UPDATE_EMPLOYEE_ID)))
                .thenReturn(true);

            // Act
            stampEditService.execute(stampEditList, UPDATE_EMPLOYEE_ID);

            // Assert
            verify(outTimeAdjuster).adjustOutTimeIfNeeded(any(), any());
            verify(stampPersistence).saveOrUpdate(eq(data), any(), any(), eq(UPDATE_EMPLOYEE_ID));
        }
    }

    @Nested
    @DisplayName("execute メソッド - 更新シナリオ")
    class ExecuteUpdateScenarioTest {

        @Test
        @DisplayName("正常系: 既存データの更新が正しく処理される")
        void execute_withExistingData_shouldUpdateCorrectly() {
            // Arrange
            Map<String, Object> stampEdit = createStampEditMap("100", "2025", "10", "1", "09:30", "18:30", "500");
            List<Map<String, Object>> stampEditList = List.of(stampEdit);

            StampEditData data = new StampEditData(500, 100, "2025", "10", "1", "09:30", "18:30");

            when(dataExtractor.extractFromMap(any())).thenReturn(data);
            when(outTimeAdjuster.adjustOutTimeIfNeeded(any(), any())).thenReturn(testOutTime);
            when(stampPersistence.saveOrUpdate(eq(data), any(), any(), eq(UPDATE_EMPLOYEE_ID)))
                .thenReturn(true);

            // Act
            stampEditService.execute(stampEditList, UPDATE_EMPLOYEE_ID);

            // Assert
            verify(stampPersistence).saveOrUpdate(eq(data), any(), any(), eq(UPDATE_EMPLOYEE_ID));
            verify(logHistoryService).execute(eq(4), eq(3), isNull(), eq(100), eq(UPDATE_EMPLOYEE_ID), any());
        }
    }

    @Nested
    @DisplayName("execute メソッド - エッジケース")
    class ExecuteEdgeCaseTest {

        @Test
        @DisplayName("正常系: 空のリストでは何も処理されない")
        void execute_withEmptyList_shouldDoNothing() {
            // Arrange
            List<Map<String, Object>> emptyList = new ArrayList<>();

            // Act
            stampEditService.execute(emptyList, UPDATE_EMPLOYEE_ID);

            // Assert
            verify(dataExtractor, never()).extractFromMap(any());
            verify(outTimeAdjuster, never()).adjustOutTimeIfNeeded(any(), any());
            verify(stampPersistence, never()).saveOrUpdate(any(), any(), any(), anyInt());
            verify(logHistoryService, never()).execute(anyInt(), anyInt(), any(), anyInt(), anyInt(), any());
        }

        @Test
        @DisplayName("正常系: employeeIdにカンマが含まれる場合も正しく処理される")
        void execute_withCommaInEmployeeId_shouldProcessCorrectly() {
            // Arrange
            Map<String, Object> stampEdit = createStampEditMap("100,200,300", "2025", "10", "1", "09:00", "18:00", null);
            List<Map<String, Object>> stampEditList = List.of(stampEdit);

            StampEditData data = new StampEditData(null, 100, "2025", "10", "1", "09:00", "18:00");

            when(dataExtractor.extractFromMap(any())).thenReturn(data);
            when(outTimeAdjuster.adjustOutTimeIfNeeded(any(), any())).thenReturn(testOutTime);
            when(stampPersistence.saveOrUpdate(any(), any(), any(), anyInt())).thenReturn(true);

            // Act
            stampEditService.execute(stampEditList, UPDATE_EMPLOYEE_ID);

            // Assert
            verify(logHistoryService).execute(eq(4), eq(3), isNull(), eq(100), eq(UPDATE_EMPLOYEE_ID), any());
        }

        @Test
        @DisplayName("正常系: 複数データの一部が失敗してもログ履歴は記録される")
        void execute_withPartialFailure_shouldRecordLogHistory() {
            // Arrange
            Map<String, Object> stamp1 = createStampEditMap("100", "2025", "10", "1", "09:00", "18:00", null);
            Map<String, Object> stamp2 = createStampEditMap("100", "2025", "10", "2", "10:00", "19:00", "999");
            List<Map<String, Object>> stampEditList = List.of(stamp1, stamp2);

            StampEditData data1 = new StampEditData(null, 100, "2025", "10", "1", "09:00", "18:00");
            StampEditData data2 = new StampEditData(999, 100, "2025", "10", "2", "10:00", "19:00");

            when(dataExtractor.extractFromMap(stamp1)).thenReturn(data1);
            when(dataExtractor.extractFromMap(stamp2)).thenReturn(data2);
            when(outTimeAdjuster.adjustOutTimeIfNeeded(any(), any())).thenReturn(testOutTime);
            when(stampPersistence.saveOrUpdate(eq(data1), any(), any(), anyInt())).thenReturn(true);
            when(stampPersistence.saveOrUpdate(eq(data2), any(), any(), anyInt())).thenReturn(false);

            // Act
            stampEditService.execute(stampEditList, UPDATE_EMPLOYEE_ID);

            // Assert
            verify(stampPersistence, times(2)).saveOrUpdate(any(), any(), any(), anyInt());
            verify(logHistoryService).execute(eq(4), eq(3), isNull(), eq(100), eq(UPDATE_EMPLOYEE_ID), any());
        }
    }

    // ヘルパーメソッド
    private Map<String, Object> createStampEditMap(String employeeId, String year, String month,
            String day, String inTime, String outTime, String id) {
        Map<String, Object> map = new HashMap<>();
        map.put("employeeId", employeeId);
        map.put("year", year);
        map.put("month", month);
        map.put("day", day);
        if (inTime != null) {
            map.put("inTime", inTime);
        }
        if (outTime != null) {
            map.put("outTime", outTime);
        }
        if (id != null) {
            map.put("id", id);
        }
        return map;
    }
}
