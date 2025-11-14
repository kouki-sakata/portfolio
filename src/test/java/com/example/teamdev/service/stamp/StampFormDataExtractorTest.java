package com.example.teamdev.service.stamp;

import com.example.teamdev.dto.StampEditData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * StampFormDataExtractorのテストクラス。
 * 各メソッドの正常系・異常系を網羅的にテストします。
 */
@DisplayName("StampFormDataExtractor テスト")
class StampFormDataExtractorTest {

    private StampFormDataExtractor extractor;

    @BeforeEach
    void setUp() {
        extractor = new StampFormDataExtractor();
    }

    @Nested
    @DisplayName("extractFromMap メソッド")
    class ExtractFromMapTest {

        @Test
        @DisplayName("正常系: 全フィールドが正しく抽出される（新規登録）")
        void extractFromMap_withNewEntry_shouldExtractAllFields() {
            // Arrange
            Map<String, Object> stampEdit = new HashMap<>();
            stampEdit.put("employeeId", "100");
            stampEdit.put("year", "2025");
            stampEdit.put("month", "10");
            stampEdit.put("day", "15");
            stampEdit.put("inTime", "09:00");
            stampEdit.put("outTime", "18:00");

            // Act
            StampEditData result = extractor.extractFromMap(stampEdit);

            // Assert
            assertAll(
                "全フィールドが正しく抽出されること",
                () -> assertNull(result.getId(), "IDはnull"),
                () -> assertEquals(100, result.getEmployeeId(), "employeeId"),
                () -> assertEquals("2025", result.getYear(), "year"),
                () -> assertEquals("10", result.getMonth(), "month"),
                () -> assertEquals("15", result.getDay(), "day"),
                () -> assertEquals(LocalDate.of(2025, 10, 15), result.getStampDate(), "stampDate"),
                () -> assertEquals("09:00", result.getInTime(), "inTime"),
                () -> assertEquals("18:00", result.getOutTime(), "outTime"),
                () -> assertTrue(result.isNewEntry(), "新規登録判定"),
                () -> assertTrue(result.hasInTime(), "出勤時刻あり"),
                () -> assertTrue(result.hasOutTime(), "退勤時刻あり")
            );
        }

        @Test
        @DisplayName("正常系: IDありの更新データが正しく抽出される")
        void extractFromMap_withExistingEntry_shouldExtractIdCorrectly() {
            // Arrange
            Map<String, Object> stampEdit = new HashMap<>();
            stampEdit.put("id", "999");
            stampEdit.put("employeeId", "200");
            stampEdit.put("year", "2025");
            stampEdit.put("month", "5");
            stampEdit.put("day", "20");
            stampEdit.put("inTime", "10:30");
            stampEdit.put("outTime", "19:45");

            // Act
            StampEditData result = extractor.extractFromMap(stampEdit);

            // Assert
            assertAll(
                "更新データが正しく抽出されること",
                () -> assertEquals(999, result.getId(), "ID"),
                () -> assertEquals(200, result.getEmployeeId(), "employeeId"),
                () -> assertEquals(LocalDate.of(2025, 5, 20), result.getStampDate(), "stampDate"),
                () -> assertFalse(result.isNewEntry(), "更新判定")
            );
        }

        @Test
        @DisplayName("正常系: 時刻がnullの場合も正しく処理される")
        void extractFromMap_withNullTimes_shouldHandleNullValues() {
            // Arrange
            Map<String, Object> stampEdit = new HashMap<>();
            stampEdit.put("employeeId", "150");
            stampEdit.put("year", "2025");
            stampEdit.put("month", "3");
            stampEdit.put("day", "10");
            stampEdit.put("inTime", null);
            stampEdit.put("outTime", null);

            // Act
            StampEditData result = extractor.extractFromMap(stampEdit);

            // Assert
            assertAll(
                "null時刻が正しく処理されること",
                () -> assertEquals(LocalDate.of(2025, 3, 10), result.getStampDate(), "stampDate"),
                () -> assertNull(result.getInTime(), "inTimeはnull"),
                () -> assertNull(result.getOutTime(), "outTimeはnull"),
                () -> assertFalse(result.hasInTime(), "出勤時刻なし"),
                () -> assertFalse(result.hasOutTime(), "退勤時刻なし")
            );
        }

        @Test
        @DisplayName("正常系: IDが空文字の場合はnullとして扱われる")
        void extractFromMap_withEmptyId_shouldTreatAsNull() {
            // Arrange
            Map<String, Object> stampEdit = new HashMap<>();
            stampEdit.put("id", "");
            stampEdit.put("employeeId", "300");
            stampEdit.put("year", "2025");
            stampEdit.put("month", "8");
            stampEdit.put("day", "5");

            // Act
            StampEditData result = extractor.extractFromMap(stampEdit);

            // Assert
            assertAll(
                "空IDがnullとして処理されること",
                () -> assertNull(result.getId(), "IDはnull"),
                () -> assertTrue(result.isNewEntry(), "新規登録として扱われる")
            );
        }

        @Test
        @DisplayName("異常系: employeeIdがカンマ区切りの場合は最初の値を使用")
        void extractFromMap_withCommaInEmployeeId_shouldUseFirstValue() {
            // Arrange
            Map<String, Object> stampEdit = new HashMap<>();
            stampEdit.put("employeeId", "100,200,300");
            stampEdit.put("year", "2025");
            stampEdit.put("month", "12");
            stampEdit.put("day", "25");

            // Act
            StampEditData result = extractor.extractFromMap(stampEdit);

            // Assert
            assertEquals(100, result.getEmployeeId(), "カンマ区切りの最初の値が使用される");
        }

        @Test
        @DisplayName("異常系: employeeIdが数値でない場合は例外をスロー")
        void extractFromMap_withInvalidEmployeeId_shouldThrowException() {
            // Arrange
            Map<String, Object> stampEdit = new HashMap<>();
            stampEdit.put("employeeId", "abc");
            stampEdit.put("year", "2025");
            stampEdit.put("month", "1");
            stampEdit.put("day", "1");

            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> extractor.extractFromMap(stampEdit)
            );
            assertTrue(exception.getMessage().contains("Invalid employee ID"));
        }

        @Test
        @DisplayName("異常系: IDが数値でない場合は例外をスロー")
        void extractFromMap_withInvalidId_shouldThrowException() {
            // Arrange
            Map<String, Object> stampEdit = new HashMap<>();
            stampEdit.put("id", "invalid");
            stampEdit.put("employeeId", "100");
            stampEdit.put("year", "2025");
            stampEdit.put("month", "6");
            stampEdit.put("day", "15");

            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> extractor.extractFromMap(stampEdit)
            );
            assertTrue(exception.getMessage().contains("Invalid stamp history ID"));
        }

        @Test
        @DisplayName("境界値: employeeIdが0の場合も正しく処理される")
        void extractFromMap_withZeroEmployeeId_shouldHandleCorrectly() {
            // Arrange
            Map<String, Object> stampEdit = new HashMap<>();
            stampEdit.put("employeeId", "0");
            stampEdit.put("year", "2025");
            stampEdit.put("month", "1");
            stampEdit.put("day", "1");

            // Act
            StampEditData result = extractor.extractFromMap(stampEdit);

            // Assert
            assertEquals(0, result.getEmployeeId(), "0も有効な値として処理される");
        }

        @Test
        @DisplayName("境界値: 負の数のemployeeIdは正しく処理される")
        void extractFromMap_withNegativeEmployeeId_shouldHandleCorrectly() {
            // Arrange
            Map<String, Object> stampEdit = new HashMap<>();
            stampEdit.put("employeeId", "-100");
            stampEdit.put("year", "2025");
            stampEdit.put("month", "2");
            stampEdit.put("day", "28");

            // Act
            StampEditData result = extractor.extractFromMap(stampEdit);

            // Assert
            assertEquals(-100, result.getEmployeeId(), "負の数も処理される");
        }

        @Test
        @DisplayName("正常系: フィールドが欠損している場合は空文字やnullになる")
        void extractFromMap_withMissingFields_shouldUseDefaultValues() {
            // Arrange
            Map<String, Object> stampEdit = new HashMap<>();
            stampEdit.put("employeeId", "500");
            // year, month, day, inTime, outTimeは未設定

            // Act
            StampEditData result = extractor.extractFromMap(stampEdit);

            // Assert
            assertAll(
                "欠損フィールドのデフォルト値",
                () -> assertEquals(500, result.getEmployeeId(), "employeeId"),
                () -> assertEquals("", result.getYear(), "yearは空文字"),
                () -> assertEquals("", result.getMonth(), "monthは空文字"),
                () -> assertEquals("", result.getDay(), "dayは空文字"),
                () -> assertNull(result.getInTime(), "inTimeはnull"),
                () -> assertNull(result.getOutTime(), "outTimeはnull")
            );
        }

        @Test
        @DisplayName("正常系: 整数型のObjectが渡された場合も正しく変換される")
        void extractFromMap_withIntegerObjects_shouldConvertToString() {
            // Arrange
            Map<String, Object> stampEdit = new HashMap<>();
            stampEdit.put("employeeId", 777);
            stampEdit.put("year", 2025);
            stampEdit.put("month", 7);
            stampEdit.put("day", 7);
            stampEdit.put("inTime", "08:00");

            // Act
            StampEditData result = extractor.extractFromMap(stampEdit);

            // Assert
            assertAll(
                "整数型Objectも正しく変換される",
                () -> assertEquals(777, result.getEmployeeId(), "employeeId"),
                () -> assertEquals("2025", result.getYear(), "year"),
                () -> assertEquals("7", result.getMonth(), "month"),
                () -> assertEquals("7", result.getDay(), "day"),
                () -> assertEquals(LocalDate.of(2025, 7, 7), result.getStampDate(), "stampDate")
            );
        }

        @Test
        @DisplayName("異常系: 日付形式が不正な場合は例外をスロー")
        void extractFromMap_withInvalidDateFormat_shouldThrowException() {
            // Arrange
            Map<String, Object> stampEdit = new HashMap<>();
            stampEdit.put("employeeId", "100");
            stampEdit.put("year", "abc");
            stampEdit.put("month", "10");
            stampEdit.put("day", "15");

            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> extractor.extractFromMap(stampEdit)
            );
            assertTrue(exception.getMessage().contains("Invalid date format"));
        }

        @Test
        @DisplayName("異常系: 無効な日付の場合は例外をスロー（2月30日）")
        void extractFromMap_withInvalidDate_shouldThrowException() {
            // Arrange
            Map<String, Object> stampEdit = new HashMap<>();
            stampEdit.put("employeeId", "100");
            stampEdit.put("year", "2025");
            stampEdit.put("month", "2");
            stampEdit.put("day", "30");

            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> extractor.extractFromMap(stampEdit)
            );
            assertTrue(exception.getMessage().contains("Invalid date"));
        }

        @Test
        @DisplayName("境界値: 閏年の2月29日は正しく処理される")
        void extractFromMap_withLeapYearDate_shouldHandleCorrectly() {
            // Arrange
            Map<String, Object> stampEdit = new HashMap<>();
            stampEdit.put("employeeId", "100");
            stampEdit.put("year", "2024");
            stampEdit.put("month", "2");
            stampEdit.put("day", "29");

            // Act
            StampEditData result = extractor.extractFromMap(stampEdit);

            // Assert
            assertEquals(LocalDate.of(2024, 2, 29), result.getStampDate(), "閏年の2月29日");
        }
    }
}
