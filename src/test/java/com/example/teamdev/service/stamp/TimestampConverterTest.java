package com.example.teamdev.service.stamp;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * TimestampConverterのテストクラス。
 * 日時変換の正常系・異常系・境界値を網羅的にテストします。
 */
@DisplayName("TimestampConverter テスト")
class TimestampConverterTest {

    private TimestampConverter converter;

    @BeforeEach
    void setUp() {
        converter = new TimestampConverter();
    }

    @Nested
    @DisplayName("convertToTimestamp メソッド")
    class ConvertToTimestampTest {

        @Test
        @DisplayName("正常系: 標準的な日時が正しく変換される")
        void convertToTimestamp_withValidDateTime_shouldConvertCorrectly() {
            // Arrange
            LocalDate date = LocalDate.of(2025, 10, 15);
            String time = "09:30";

            // Act
            Timestamp result = converter.convertToTimestamp(date, time);

            // Assert
            assertNotNull(result);
            LocalDateTime expected = LocalDateTime.of(2025, 10, 15, 9, 30);
            assertEquals(Timestamp.valueOf(expected), result);
        }

        @Test
        @DisplayName("正常系: 時刻がnullの場合はnullを返す")
        void convertToTimestamp_withNullTime_shouldReturnNull() {
            // Act
            Timestamp result = converter.convertToTimestamp(LocalDate.of(2025, 5, 20), null);

            // Assert
            assertNull(result, "時刻がnullの場合はnullを返す");
        }

        @Test
        @DisplayName("正常系: 時刻が空文字の場合はnullを返す")
        void convertToTimestamp_withEmptyTime_shouldReturnNull() {
            // Act
            Timestamp result = converter.convertToTimestamp(LocalDate.of(2025, 3, 10), "");

            // Assert
            assertNull(result, "時刻が空文字の場合はnullを返す");
        }

        @ParameterizedTest
        @CsvSource({
            "2025, 1, 1, 00:00",    // 年始
            "2025, 12, 31, 23:59",  // 年末
            "2025, 2, 28, 12:00",   // 平年2月末
            "2024, 2, 29, 15:30",   // うるう年2月29日
            "2025, 6, 15, 06:45"    // 通常の日
        })
        @DisplayName("境界値: 特殊な日付が正しく変換される")
        void convertToTimestamp_withBoundaryDates_shouldConvertCorrectly(
                int year, int month, int day, String time) {
            // Act
            Timestamp result = converter.convertToTimestamp(LocalDate.of(year, month, day), time);

            // Assert
            assertNotNull(result, "境界値日付も正しく変換される");
        }

        @Test
        @DisplayName("異常系: 無効な時刻フォーマットで例外をスロー")
        void convertToTimestamp_withInvalidTimeFormat_shouldThrowException() {
            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> converter.convertToTimestamp(LocalDate.of(2025, 10, 15), "25:00")
            );
            assertTrue(exception.getMessage().contains("Invalid date/time format"));
        }

        @Test
        @DisplayName("正常系: 1桁の月日も正しく処理される")
        void convertToTimestamp_withSingleDigitMonthDay_shouldConvertCorrectly() {
            // Act
            Timestamp result = converter.convertToTimestamp(LocalDate.of(2025, 5, 3), "08:05");

            // Assert
            assertNotNull(result);
            LocalDateTime expected = LocalDateTime.of(2025, 5, 3, 8, 5);
            assertEquals(Timestamp.valueOf(expected), result);
        }

        @Test
        @DisplayName("異常系: dateがnullで例外をスロー")
        void convertToTimestamp_withNullDate_shouldThrowException() {
            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> converter.convertToTimestamp(null, "10:00")
            );
            assertEquals("Date is required", exception.getMessage());
        }
    }

    @Nested
    @DisplayName("convertInTime メソッド")
    class ConvertInTimeTest {

        @Test
        @DisplayName("正常系: 出勤時刻が正しく変換される")
        void convertInTime_withValidInTime_shouldConvertCorrectly() {
            // Act
            Timestamp result = converter.convertInTime(LocalDate.of(2025, 10, 1), "09:00");

            // Assert
            assertNotNull(result);
            LocalDateTime expected = LocalDateTime.of(2025, 10, 1, 9, 0);
            assertEquals(Timestamp.valueOf(expected), result);
        }

        @Test
        @DisplayName("正常系: 出勤時刻がnullの場合はnullを返す")
        void convertInTime_withNullInTime_shouldReturnNull() {
            // Act
            Timestamp result = converter.convertInTime(LocalDate.of(2025, 10, 1), null);

            // Assert
            assertNull(result);
        }

        @ParameterizedTest
        @CsvSource({
            "2025, 10, 1, 00:00",   // 深夜0時
            "2025, 10, 1, 06:30",   // 早朝
            "2025, 10, 1, 09:00",   // 通常
            "2025, 10, 1, 12:00"    // 昼
        })
        @DisplayName("境界値: 様々な出勤時刻パターンが正しく変換される")
        void convertInTime_withVariousTimes_shouldConvertCorrectly(
                int year, int month, int day, String inTime) {
            // Act
            Timestamp result = converter.convertInTime(LocalDate.of(year, month, day), inTime);

            // Assert
            assertNotNull(result);
        }
    }

    @Nested
    @DisplayName("convertOutTime メソッド")
    class ConvertOutTimeTest {

        @Test
        @DisplayName("正常系: 退勤時刻が正しく変換される")
        void convertOutTime_withValidOutTime_shouldConvertCorrectly() {
            // Act
            Timestamp result = converter.convertOutTime(LocalDate.of(2025, 10, 1), "18:00");

            // Assert
            assertNotNull(result);
            LocalDateTime expected = LocalDateTime.of(2025, 10, 1, 18, 0);
            assertEquals(Timestamp.valueOf(expected), result);
        }

        @Test
        @DisplayName("正常系: 退勤時刻がnullの場合はnullを返す")
        void convertOutTime_withNullOutTime_shouldReturnNull() {
            // Act
            Timestamp result = converter.convertOutTime(LocalDate.of(2025, 10, 1), null);

            // Assert
            assertNull(result);
        }

        @ParameterizedTest
        @CsvSource({
            "2025, 10, 1, 17:00",   // 定時
            "2025, 10, 1, 20:30",   // 残業
            "2025, 10, 1, 23:59",   // 深夜
            "2025, 10, 1, 12:00"    // 昼退勤
        })
        @DisplayName("境界値: 様々な退勤時刻パターンが正しく変換される")
        void convertOutTime_withVariousTimes_shouldConvertCorrectly(
                int year, int month, int day, String outTime) {
            // Act
            Timestamp result = converter.convertOutTime(LocalDate.of(year, month, day), outTime);

            // Assert
            assertNotNull(result);
        }
    }

    @Nested
    @DisplayName("parseToLocalDateTime メソッド")
    class ParseToLocalDateTimeTest {

        @Test
        @DisplayName("正常系: LocalDateTimeに正しく変換される")
        void parseToLocalDateTime_withValidInput_shouldConvertCorrectly() {
            // Act
            LocalDateTime result = converter.parseToLocalDateTime(LocalDate.of(2025, 10, 15), "14:30");

            // Assert
            LocalDateTime expected = LocalDateTime.of(2025, 10, 15, 14, 30);
            assertEquals(expected, result);
        }

        @Test
        @DisplayName("異常系: dateがnullで例外をスロー")
        void parseToLocalDateTime_withNullDate_shouldThrowException() {
            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> converter.parseToLocalDateTime(null, "10:00")
            );
            assertEquals("Date is required", exception.getMessage());
        }

        @Test
        @DisplayName("異常系: timeがnullで例外をスロー")
        void parseToLocalDateTime_withNullTime_shouldThrowException() {
            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> converter.parseToLocalDateTime(LocalDate.of(2025, 10, 15), null)
            );
            assertEquals("Time is required", exception.getMessage());
        }

        @Test
        @DisplayName("異常系: timeが空文字で例外をスロー")
        void parseToLocalDateTime_withEmptyTime_shouldThrowException() {
            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> converter.parseToLocalDateTime(LocalDate.of(2025, 10, 15), "")
            );
            assertEquals("Time is required", exception.getMessage());
        }

        @ParameterizedTest
        @CsvSource({
            "2024, 2, 29, 23:59",   // うるう年の境界
            "2025, 1, 31, 00:00",   // 月末から月初
            "2025, 4, 30, 12:00",   // 30日までの月
            "2025, 7, 15, 15:45"    // 通常の日
        })
        @DisplayName("境界値: 特殊な日時パターンが正しく変換される")
        void parseToLocalDateTime_withBoundaryDates_shouldConvertCorrectly(
                int year, int month, int day, String time) {
            // Act
            LocalDateTime result = converter.parseToLocalDateTime(LocalDate.of(year, month, day), time);

            // Assert
            assertNotNull(result);
        }
    }

    @Nested
    @DisplayName("統合テスト")
    class IntegrationTest {

        @Test
        @DisplayName("convertInTimeとconvertOutTimeで同じ日付が使用できる")
        void convertInTimeAndOutTime_withSameDate_shouldWorkTogether() {
            // Arrange
            LocalDate date = LocalDate.of(2025, 10, 15);

            // Act
            Timestamp inTime = converter.convertInTime(date, "09:00");
            Timestamp outTime = converter.convertOutTime(date, "18:00");

            // Assert
            assertNotNull(inTime);
            assertNotNull(outTime);
            assertTrue(outTime.after(inTime), "退勤時刻は出勤時刻より後");
        }

        @Test
        @DisplayName("nullと有効値の混在が正しく処理される")
        void convertMixedNullAndValidValues_shouldHandleCorrectly() {
            // Act
            Timestamp inTime = converter.convertInTime(LocalDate.of(2025, 10, 1), "09:00");
            Timestamp nullOutTime = converter.convertOutTime(LocalDate.of(2025, 10, 1), null);

            // Assert
            assertNotNull(inTime, "出勤時刻は設定される");
            assertNull(nullOutTime, "退勤時刻はnull");
        }
    }
}
