package com.example.teamdev.service.stamp;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.sql.Timestamp;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * OutTimeAdjusterのテストクラス。
 * 日付跨ぎロジックの正常系・異常系・境界値を網羅的にテストします。
 */
@DisplayName("OutTimeAdjuster テスト")
class OutTimeAdjusterTest {

    private OutTimeAdjuster adjuster;

    @BeforeEach
    void setUp() {
        adjuster = new OutTimeAdjuster();
    }

    @Nested
    @DisplayName("adjustOutTimeIfNeeded メソッド")
    class AdjustOutTimeIfNeededTest {

        @Test
        @DisplayName("正常系: 通常の勤務（調整不要）")
        void adjustOutTimeIfNeeded_withNormalWorkDay_shouldNotAdjust() {
            // Arrange: 9:00出勤、18:00退勤
            Timestamp inTime = createTimestamp(2025, 10, 1, 9, 0);
            Timestamp outTime = createTimestamp(2025, 10, 1, 18, 0);

            // Act
            Timestamp result = adjuster.adjustOutTimeIfNeeded(inTime, outTime);

            // Assert
            assertEquals(outTime, result, "通常勤務は調整されない");
            assertEquals(createTimestamp(2025, 10, 1, 18, 0), result);
        }

        @Test
        @DisplayName("正常系: 夜勤シフト（日跨ぎあり）- 翌日に調整")
        void adjustOutTimeIfNeeded_withNightShift_shouldAdjustToNextDay() {
            // Arrange: 22:00出勤、6:00退勤（日跨ぎ）
            Timestamp inTime = createTimestamp(2025, 10, 1, 22, 0);
            Timestamp outTime = createTimestamp(2025, 10, 1, 6, 0);

            // Act
            Timestamp result = adjuster.adjustOutTimeIfNeeded(inTime, outTime);

            // Assert
            assertNotEquals(outTime, result, "退勤時刻は調整される");
            assertEquals(createTimestamp(2025, 10, 2, 6, 0), result, "翌日6時に調整");
        }

        @Test
        @DisplayName("正常系: 深夜残業（日跨ぎあり）- 翌日に調整")
        void adjustOutTimeIfNeeded_withOvernightWork_shouldAdjustToNextDay() {
            // Arrange: 18:00出勤、2:00退勤（日跨ぎ）
            Timestamp inTime = createTimestamp(2025, 10, 15, 18, 0);
            Timestamp outTime = createTimestamp(2025, 10, 15, 2, 0);

            // Act
            Timestamp result = adjuster.adjustOutTimeIfNeeded(inTime, outTime);

            // Assert
            assertEquals(createTimestamp(2025, 10, 16, 2, 0), result, "翌日2時に調整");
        }

        @Test
        @DisplayName("正常系: 出勤時刻がnullの場合は調整せず元の値を返す")
        void adjustOutTimeIfNeeded_withNullInTime_shouldReturnOriginal() {
            // Arrange
            Timestamp outTime = createTimestamp(2025, 10, 1, 18, 0);

            // Act
            Timestamp result = adjuster.adjustOutTimeIfNeeded(null, outTime);

            // Assert
            assertEquals(outTime, result, "出勤時刻がnullの場合は調整しない");
        }

        @Test
        @DisplayName("正常系: 退勤時刻がnullの場合はnullを返す")
        void adjustOutTimeIfNeeded_withNullOutTime_shouldReturnNull() {
            // Arrange
            Timestamp inTime = createTimestamp(2025, 10, 1, 9, 0);

            // Act
            Timestamp result = adjuster.adjustOutTimeIfNeeded(inTime, null);

            // Assert
            assertNull(result, "退勤時刻がnullの場合はnullを返す");
        }

        @Test
        @DisplayName("正常系: 両方nullの場合はnullを返す")
        void adjustOutTimeIfNeeded_withBothNull_shouldReturnNull() {
            // Act
            Timestamp result = adjuster.adjustOutTimeIfNeeded(null, null);

            // Assert
            assertNull(result, "両方nullの場合はnullを返す");
        }

        @Test
        @DisplayName("境界値: 出勤退勤が同時刻の場合は調整しない")
        void adjustOutTimeIfNeeded_withSameTime_shouldNotAdjust() {
            // Arrange: 12:00出勤、12:00退勤
            Timestamp time = createTimestamp(2025, 10, 1, 12, 0);

            // Act
            Timestamp result = adjuster.adjustOutTimeIfNeeded(time, time);

            // Assert
            assertEquals(time, result, "同時刻の場合は調整しない");
        }

        @Test
        @DisplayName("境界値: 1分差で日跨ぎ判定")
        void adjustOutTimeIfNeeded_withOneMinuteDifference_shouldAdjust() {
            // Arrange: 23:59出勤、23:58退勤（1分前）
            Timestamp inTime = createTimestamp(2025, 10, 1, 23, 59);
            Timestamp outTime = createTimestamp(2025, 10, 1, 23, 58);

            // Act
            Timestamp result = adjuster.adjustOutTimeIfNeeded(inTime, outTime);

            // Assert
            assertEquals(createTimestamp(2025, 10, 2, 23, 58), result, "1分差でも翌日に調整");
        }

        @ParameterizedTest
        @CsvSource({
            "2025, 10, 1, 23, 0, 2025, 10, 1, 1, 0, 2025, 10, 2, 1, 0",    // 深夜シフト
            "2025, 10, 1, 20, 30, 2025, 10, 1, 5, 30, 2025, 10, 2, 5, 30", // 夜勤
            "2025, 10, 31, 22, 0, 2025, 10, 31, 6, 0, 2025, 11, 1, 6, 0",  // 月跨ぎ
            "2025, 12, 31, 23, 0, 2025, 12, 31, 2, 0, 2026, 1, 1, 2, 0"    // 年跨ぎ
        })
        @DisplayName("境界値: 様々な日跨ぎパターンが正しく調整される")
        void adjustOutTimeIfNeeded_withVariousOvernight_shouldAdjustCorrectly(
                int inYear, int inMonth, int inDay, int inHour, int inMinute,
                int outYear, int outMonth, int outDay, int outHour, int outMinute,
                int expectedYear, int expectedMonth, int expectedDay, int expectedHour, int expectedMinute) {
            // Arrange
            Timestamp inTime = createTimestamp(inYear, inMonth, inDay, inHour, inMinute);
            Timestamp outTime = createTimestamp(outYear, outMonth, outDay, outHour, outMinute);
            Timestamp expected = createTimestamp(expectedYear, expectedMonth, expectedDay, expectedHour, expectedMinute);

            // Act
            Timestamp result = adjuster.adjustOutTimeIfNeeded(inTime, outTime);

            // Assert
            assertEquals(expected, result);
        }

        @Test
        @DisplayName("正常系: 長時間勤務（24時間以上）でも正しく動作")
        void adjustOutTimeIfNeeded_withLongWorkHours_shouldWorkCorrectly() {
            // Arrange: 9:00出勤、翌日9:00退勤（既に翌日）
            Timestamp inTime = createTimestamp(2025, 10, 1, 9, 0);
            Timestamp outTime = createTimestamp(2025, 10, 2, 9, 0);

            // Act
            Timestamp result = adjuster.adjustOutTimeIfNeeded(inTime, outTime);

            // Assert
            assertEquals(outTime, result, "既に翌日の場合は調整しない");
        }
    }

    @Nested
    @DisplayName("calculateWorkingMinutes メソッド")
    class CalculateWorkingMinutesTest {

        @Test
        @DisplayName("正常系: 通常の8時間勤務")
        void calculateWorkingMinutes_withNormalWorkDay_shouldCalculateCorrectly() {
            // Arrange: 9:00-18:00（9時間 = 540分）
            Timestamp inTime = createTimestamp(2025, 10, 1, 9, 0);
            Timestamp outTime = createTimestamp(2025, 10, 1, 18, 0);

            // Act
            long result = adjuster.calculateWorkingMinutes(inTime, outTime);

            // Assert
            assertEquals(540, result, "9時間 = 540分");
        }

        @Test
        @DisplayName("正常系: 夜勤シフトの勤務時間計算")
        void calculateWorkingMinutes_withNightShift_shouldCalculateWithAdjustment() {
            // Arrange: 22:00出勤、6:00退勤（日跨ぎ、8時間勤務）
            Timestamp inTime = createTimestamp(2025, 10, 1, 22, 0);
            Timestamp outTime = createTimestamp(2025, 10, 1, 6, 0);

            // Act
            long result = adjuster.calculateWorkingMinutes(inTime, outTime);

            // Assert
            assertEquals(480, result, "22:00-翌6:00 = 8時間 = 480分");
        }

        @Test
        @DisplayName("正常系: 短時間勤務")
        void calculateWorkingMinutes_withShortWork_shouldCalculateCorrectly() {
            // Arrange: 10:00-12:30（2時間30分 = 150分）
            Timestamp inTime = createTimestamp(2025, 10, 1, 10, 0);
            Timestamp outTime = createTimestamp(2025, 10, 1, 12, 30);

            // Act
            long result = adjuster.calculateWorkingMinutes(inTime, outTime);

            // Assert
            assertEquals(150, result, "2時間30分 = 150分");
        }

        @Test
        @DisplayName("正常系: 出勤時刻がnullの場合は0を返す")
        void calculateWorkingMinutes_withNullInTime_shouldReturnZero() {
            // Arrange
            Timestamp outTime = createTimestamp(2025, 10, 1, 18, 0);

            // Act
            long result = adjuster.calculateWorkingMinutes(null, outTime);

            // Assert
            assertEquals(0, result, "出勤時刻がnullの場合は0");
        }

        @Test
        @DisplayName("正常系: 退勤時刻がnullの場合は0を返す")
        void calculateWorkingMinutes_withNullOutTime_shouldReturnZero() {
            // Arrange
            Timestamp inTime = createTimestamp(2025, 10, 1, 9, 0);

            // Act
            long result = adjuster.calculateWorkingMinutes(inTime, null);

            // Assert
            assertEquals(0, result, "退勤時刻がnullの場合は0");
        }

        @Test
        @DisplayName("正常系: 両方nullの場合は0を返す")
        void calculateWorkingMinutes_withBothNull_shouldReturnZero() {
            // Act
            long result = adjuster.calculateWorkingMinutes(null, null);

            // Assert
            assertEquals(0, result, "両方nullの場合は0");
        }

        @Test
        @DisplayName("境界値: 同時刻の場合は0分")
        void calculateWorkingMinutes_withSameTime_shouldReturnZero() {
            // Arrange
            Timestamp time = createTimestamp(2025, 10, 1, 12, 0);

            // Act
            long result = adjuster.calculateWorkingMinutes(time, time);

            // Assert
            assertEquals(0, result, "同時刻の場合は0分");
        }

        @Test
        @DisplayName("境界値: 1分勤務")
        void calculateWorkingMinutes_withOneMinute_shouldReturnOne() {
            // Arrange: 9:00-9:01
            Timestamp inTime = createTimestamp(2025, 10, 1, 9, 0);
            Timestamp outTime = createTimestamp(2025, 10, 1, 9, 1);

            // Act
            long result = adjuster.calculateWorkingMinutes(inTime, outTime);

            // Assert
            assertEquals(1, result, "1分勤務");
        }

        @Test
        @DisplayName("正常系: 深夜残業を含む長時間勤務")
        void calculateWorkingMinutes_withOvernightLongWork_shouldCalculateCorrectly() {
            // Arrange: 9:00出勤、翌3:00退勤（18時間 = 1080分）
            Timestamp inTime = createTimestamp(2025, 10, 1, 9, 0);
            Timestamp outTime = createTimestamp(2025, 10, 1, 3, 0);

            // Act
            long result = adjuster.calculateWorkingMinutes(inTime, outTime);

            // Assert
            assertEquals(1080, result, "9:00-翌3:00 = 18時間 = 1080分");
        }

        @ParameterizedTest
        @CsvSource({
            "9, 0, 17, 0, 480",     // 8時間
            "8, 30, 17, 30, 540",   // 9時間
            "10, 15, 12, 45, 150",  // 2時間30分
            "13, 0, 14, 0, 60"      // 1時間
        })
        @DisplayName("境界値: 様々な勤務時間パターンが正しく計算される")
        void calculateWorkingMinutes_withVariousPatterns_shouldCalculateCorrectly(
                int inHour, int inMinute, int outHour, int outMinute, long expectedMinutes) {
            // Arrange
            Timestamp inTime = createTimestamp(2025, 10, 1, inHour, inMinute);
            Timestamp outTime = createTimestamp(2025, 10, 1, outHour, outMinute);

            // Act
            long result = adjuster.calculateWorkingMinutes(inTime, outTime);

            // Assert
            assertEquals(expectedMinutes, result);
        }
    }

    @Nested
    @DisplayName("統合テスト")
    class IntegrationTest {

        @Test
        @DisplayName("日跨ぎ調整と勤務時間計算が連携して動作")
        void adjustmentAndCalculation_shouldWorkTogether() {
            // Arrange: 22:00出勤、翌6:00退勤（8時間勤務）
            Timestamp inTime = createTimestamp(2025, 10, 1, 22, 0);
            Timestamp outTime = createTimestamp(2025, 10, 1, 6, 0);

            // Act
            Timestamp adjusted = adjuster.adjustOutTimeIfNeeded(inTime, outTime);
            long workingMinutes = adjuster.calculateWorkingMinutes(inTime, outTime);

            // Assert
            assertAll(
                "日跨ぎ調整と勤務時間計算",
                () -> assertEquals(createTimestamp(2025, 10, 2, 6, 0), adjusted, "翌日に調整"),
                () -> assertEquals(480, workingMinutes, "8時間 = 480分")
            );
        }

        @Test
        @DisplayName("月跨ぎの夜勤シフトが正しく処理される")
        void monthBoundaryNightShift_shouldBeHandledCorrectly() {
            // Arrange: 10/31 23:00出勤、11/1 7:00退勤
            Timestamp inTime = createTimestamp(2025, 10, 31, 23, 0);
            Timestamp outTime = createTimestamp(2025, 10, 31, 7, 0);

            // Act
            Timestamp adjusted = adjuster.adjustOutTimeIfNeeded(inTime, outTime);
            long workingMinutes = adjuster.calculateWorkingMinutes(inTime, outTime);

            // Assert
            assertAll(
                "月跨ぎの処理",
                () -> assertEquals(createTimestamp(2025, 11, 1, 7, 0), adjusted, "翌月に調整"),
                () -> assertEquals(480, workingMinutes, "8時間 = 480分")
            );
        }

        @Test
        @DisplayName("年跨ぎの夜勤シフトが正しく処理される")
        void yearBoundaryNightShift_shouldBeHandledCorrectly() {
            // Arrange: 12/31 22:00出勤、1/1 6:00退勤
            Timestamp inTime = createTimestamp(2025, 12, 31, 22, 0);
            Timestamp outTime = createTimestamp(2025, 12, 31, 6, 0);

            // Act
            Timestamp adjusted = adjuster.adjustOutTimeIfNeeded(inTime, outTime);
            long workingMinutes = adjuster.calculateWorkingMinutes(inTime, outTime);

            // Assert
            assertAll(
                "年跨ぎの処理",
                () -> assertEquals(createTimestamp(2026, 1, 1, 6, 0), adjusted, "翌年に調整"),
                () -> assertEquals(480, workingMinutes, "8時間 = 480分")
            );
        }
    }

    // ヘルパーメソッド
    private Timestamp createTimestamp(int year, int month, int day, int hour, int minute) {
        LocalDateTime localDateTime = LocalDateTime.of(year, month, day, hour, minute);
        return Timestamp.valueOf(localDateTime);
    }
}
