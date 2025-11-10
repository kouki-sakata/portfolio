package com.example.teamdev.mapper;

import com.example.teamdev.entity.MonthlyAttendanceStats;
import com.example.teamdev.entity.StampHistory;
import com.example.teamdev.testconfig.PostgresContainerSupport;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * StampHistoryMapperの残業時間計算ロジックを検証する統合テスト
 *
 * 問題: 固定160時間閾値による残業時間の過少計算
 * 修正: 日次ベース（実働時間 - 8時間）での残業時間計算
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("StampHistoryMapper 残業時間計算テスト")
class StampHistoryMapperOvertimeCalculationTest extends PostgresContainerSupport {

    @Autowired
    private StampHistoryMapper stampHistoryMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final int TEST_EMPLOYEE_ID = 9999;
    private static final String TEST_YEAR = "2025";
    private static final String TEST_MONTH = "01";

    @BeforeEach
    void setUp() {
        // テスト用の従業員データを準備
        jdbcTemplate.execute("""
            INSERT INTO employee (id, first_name, last_name, email, password, admin_flag, update_date, profile_metadata)
            VALUES (9999, 'Test', 'User', 'test@example.com', 'password', 0, NOW(),
                    '{"schedule": {"start": "09:00", "end": "18:00", "breakMinutes": "60"}}'::jsonb)
            ON CONFLICT (id) DO NOTHING
            """);
    }

    @AfterEach
    void tearDown() {
        // テストデータをクリーンアップ
        jdbcTemplate.update("DELETE FROM stamp_history WHERE employee_id = ?", TEST_EMPLOYEE_ID);
        jdbcTemplate.update("DELETE FROM employee WHERE id = ?", TEST_EMPLOYEE_ID);
    }

    @Test
    @DisplayName("12日勤務 × 10時間/日 = 24時間の残業（問題のケース）")
    void calculateOvertimeFor12DaysWithDailyOvertime() {
        // Arrange: 12日間、毎日10時間勤務（残業2時間/日）
        for (int day = 1; day <= 12; day++) {
            insertStampHistory(day, 9, 0, 19, 0); // 9:00-19:00 (10時間勤務、休憩1時間で実働9時間、残業1時間)
        }

        // Act
        List<MonthlyAttendanceStats> stats = stampHistoryMapper.findMonthlyStatistics(
            TEST_EMPLOYEE_ID, "2025-01", "2025-01"
        );

        // Assert
        assertThat(stats).hasSize(1);
        MonthlyAttendanceStats result = stats.get(0);

        assertThat(result.getMonth()).isEqualTo("2025-01");
        assertThat(result.getTotalHours()).isEqualByComparingTo(new BigDecimal("108.00")); // 9h × 12日
        assertThat(result.getOvertimeHours())
            .as("12日間、毎日1時間の残業 = 12時間")
            .isEqualByComparingTo(new BigDecimal("12.00")); // (9-8) × 12日 = 12時間
    }

    @Test
    @DisplayName("20日勤務 × 8時間/日 = 0時間の残業（残業なし）")
    void calculateOvertimeFor20DaysWithStandardHours() {
        // Arrange: 20日間、毎日8時間勤務（残業なし）
        for (int day = 1; day <= 20; day++) {
            insertStampHistory(day, 9, 0, 18, 0); // 9:00-18:00 (9時間勤務、休憩1時間で実働8時間)
        }

        // Act
        List<MonthlyAttendanceStats> stats = stampHistoryMapper.findMonthlyStatistics(
            TEST_EMPLOYEE_ID, "2025-01", "2025-01"
        );

        // Assert
        assertThat(stats).hasSize(1);
        MonthlyAttendanceStats result = stats.get(0);

        assertThat(result.getMonth()).isEqualTo("2025-01");
        assertThat(result.getTotalHours()).isEqualByComparingTo(new BigDecimal("160.00")); // 8h × 20日
        assertThat(result.getOvertimeHours())
            .as("残業なしの場合は0時間")
            .isEqualByComparingTo(new BigDecimal("0.00"));
    }

    @Test
    @DisplayName("混在パターン: 8日×12時間 + 7日×8時間 = 32時間の残業")
    void calculateOvertimeForMixedWorkPattern() {
        // Arrange: 不規則な勤務パターン
        // 8日間: 9:00-21:00 (12時間勤務、休憩1時間で実働11時間、残業3時間/日)
        for (int day = 1; day <= 8; day++) {
            insertStampHistory(day, 9, 0, 21, 0);
        }

        // 7日間: 9:00-18:00 (9時間勤務、休憩1時間で実働8時間、残業なし)
        for (int day = 9; day <= 15; day++) {
            insertStampHistory(day, 9, 0, 18, 0);
        }

        // Act
        List<MonthlyAttendanceStats> stats = stampHistoryMapper.findMonthlyStatistics(
            TEST_EMPLOYEE_ID, "2025-01", "2025-01"
        );

        // Assert
        assertThat(stats).hasSize(1);
        MonthlyAttendanceStats result = stats.get(0);

        assertThat(result.getMonth()).isEqualTo("2025-01");
        assertThat(result.getTotalHours()).isEqualByComparingTo(new BigDecimal("144.00")); // (11×8) + (8×7)
        assertThat(result.getOvertimeHours())
            .as("8日間×3時間の残業 = 24時間")
            .isEqualByComparingTo(new BigDecimal("24.00")); // (11-8)×8 = 24時間
    }

    @Test
    @DisplayName("退勤時刻がnullの日は残業時間0として計算される")
    void calculateOvertimeWhenOutTimeIsNull() {
        // Arrange: 一部の日に退勤打刻がない
        for (int day = 1; day <= 5; day++) {
            insertStampHistory(day, 9, 0, 19, 0); // 残業あり
        }
        for (int day = 6; day <= 10; day++) {
            insertStampHistoryWithoutOutTime(day, 9, 0); // 退勤打刻なし
        }

        // Act
        List<MonthlyAttendanceStats> stats = stampHistoryMapper.findMonthlyStatistics(
            TEST_EMPLOYEE_ID, "2025-01", "2025-01"
        );

        // Assert
        assertThat(stats).hasSize(1);
        MonthlyAttendanceStats result = stats.get(0);

        assertThat(result.getTotalHours()).isEqualByComparingTo(new BigDecimal("45.00")); // 9h × 5日
        assertThat(result.getOvertimeHours())
            .as("退勤打刻がある5日間のみ残業計算")
            .isEqualByComparingTo(new BigDecimal("5.00")); // (9-8) × 5日
    }

    @Test
    @DisplayName("休憩時間が考慮されて残業時間が正確に計算される")
    void calculateOvertimeConsideringBreakTime() {
        // Arrange: 9:00-19:00勤務、休憩60分（実際の休憩時間記録あり）
        // 10時間 - 1時間休憩 = 9時間実働、残業1時間
        for (int day = 1; day <= 10; day++) {
            insertStampHistory(day, 9, 0, 19, 0);
        }

        // Act
        List<MonthlyAttendanceStats> stats = stampHistoryMapper.findMonthlyStatistics(
            TEST_EMPLOYEE_ID, "2025-01", "2025-01"
        );

        // Assert
        assertThat(stats).hasSize(1);
        MonthlyAttendanceStats result = stats.get(0);

        assertThat(result.getTotalHours()).isEqualByComparingTo(new BigDecimal("90.00")); // 9h × 10日
        assertThat(result.getOvertimeHours())
            .as("休憩時間を除いた実働時間から残業を計算")
            .isEqualByComparingTo(new BigDecimal("10.00")); // (9-8) × 10日
    }

    @Test
    @DisplayName("休憩時間が未記録の場合はスケジュールの休憩時間を使用して月次統計を計算")
    void calculateMonthlyStatsUsingScheduleBreakWhenBreakNotRecorded() {
        // Arrange: 9:00-19:00勤務（10時間拘束）、休憩未記録
        // スケジュール休憩60分が適用されるべき
        // 実働: 10h - 1h(スケジュール休憩) = 9h
        // 残業: 9h - 8h = 1h/日
        for (int day = 1; day <= 10; day++) {
            insertStampHistoryWithoutBreak(day, 9, 0, 19, 0);
        }

        // Act
        List<MonthlyAttendanceStats> stats = stampHistoryMapper.findMonthlyStatistics(
            TEST_EMPLOYEE_ID, "2025-01", "2025-01"
        );

        // Assert
        assertThat(stats).hasSize(1);
        MonthlyAttendanceStats result = stats.get(0);

        assertThat(result.getMonth()).isEqualTo("2025-01");
        assertThat(result.getTotalHours())
            .as("10日間、各日9時間実働 = 90時間")
            .isEqualByComparingTo(new BigDecimal("90.00")); // (10h - 1h) × 10日
        assertThat(result.getOvertimeHours())
            .as("スケジュール休憩60分を使用して残業計算")
            .isEqualByComparingTo(new BigDecimal("10.00")); // (9h - 8h) × 10日
    }

    /**
     * 打刻履歴をINSERTするヘルパーメソッド
     */
    private void insertStampHistory(int day, int inHour, int inMinute, int outHour, int outMinute) {
        StampHistory history = new StampHistory();
        history.setYear(TEST_YEAR);
        history.setMonth(TEST_MONTH);
        history.setDay(String.format("%02d", day));
        history.setEmployeeId(TEST_EMPLOYEE_ID);

        OffsetDateTime inTime = OffsetDateTime.of(
            Integer.parseInt(TEST_YEAR),
            Integer.parseInt(TEST_MONTH),
            day,
            inHour,
            inMinute,
            0,
            0,
            ZoneOffset.ofHours(9)
        );

        OffsetDateTime outTime = OffsetDateTime.of(
            Integer.parseInt(TEST_YEAR),
            Integer.parseInt(TEST_MONTH),
            day,
            outHour,
            outMinute,
            0,
            0,
            ZoneOffset.ofHours(9)
        );

        // 休憩時間を設定（12:00-13:00の1時間）
        OffsetDateTime breakStartTime = OffsetDateTime.of(
            Integer.parseInt(TEST_YEAR),
            Integer.parseInt(TEST_MONTH),
            day,
            12,
            0,
            0,
            0,
            ZoneOffset.ofHours(9)
        );

        OffsetDateTime breakEndTime = OffsetDateTime.of(
            Integer.parseInt(TEST_YEAR),
            Integer.parseInt(TEST_MONTH),
            day,
            13,
            0,
            0,
            0,
            ZoneOffset.ofHours(9)
        );

        history.setInTime(inTime);
        history.setOutTime(outTime);
        history.setBreakStartTime(breakStartTime);
        history.setBreakEndTime(breakEndTime);
        history.setUpdateEmployeeId(TEST_EMPLOYEE_ID);
        history.setUpdateDate(OffsetDateTime.now(ZoneOffset.ofHours(9)));

        stampHistoryMapper.save(history);
    }

    /**
     * 退勤時刻なしの打刻履歴をINSERTするヘルパーメソッド
     */
    private void insertStampHistoryWithoutOutTime(int day, int inHour, int inMinute) {
        StampHistory history = new StampHistory();
        history.setYear(TEST_YEAR);
        history.setMonth(TEST_MONTH);
        history.setDay(String.format("%02d", day));
        history.setEmployeeId(TEST_EMPLOYEE_ID);

        OffsetDateTime inTime = OffsetDateTime.of(
            Integer.parseInt(TEST_YEAR),
            Integer.parseInt(TEST_MONTH),
            day,
            inHour,
            inMinute,
            0,
            0,
            ZoneOffset.ofHours(9)
        );

        history.setInTime(inTime);
        history.setOutTime(null);
        history.setUpdateEmployeeId(TEST_EMPLOYEE_ID);
        history.setUpdateDate(OffsetDateTime.now(ZoneOffset.ofHours(9)));

        stampHistoryMapper.save(history);
    }

    /**
     * 休憩時間なしの打刻履歴をINSERTするヘルパーメソッド
     * （休憩時間が未記録の場合のテスト用）
     */
    private void insertStampHistoryWithoutBreak(int day, int inHour, int inMinute, int outHour, int outMinute) {
        StampHistory history = new StampHistory();
        history.setYear(TEST_YEAR);
        history.setMonth(TEST_MONTH);
        history.setDay(String.format("%02d", day));
        history.setEmployeeId(TEST_EMPLOYEE_ID);

        OffsetDateTime inTime = OffsetDateTime.of(
            Integer.parseInt(TEST_YEAR),
            Integer.parseInt(TEST_MONTH),
            day,
            inHour,
            inMinute,
            0,
            0,
            ZoneOffset.ofHours(9)
        );

        OffsetDateTime outTime = OffsetDateTime.of(
            Integer.parseInt(TEST_YEAR),
            Integer.parseInt(TEST_MONTH),
            day,
            outHour,
            outMinute,
            0,
            0,
            ZoneOffset.ofHours(9)
        );

        history.setInTime(inTime);
        history.setOutTime(outTime);
        history.setBreakStartTime(null);  // 休憩開始時刻なし
        history.setBreakEndTime(null);    // 休憩終了時刻なし
        history.setUpdateEmployeeId(TEST_EMPLOYEE_ID);
        history.setUpdateDate(OffsetDateTime.now(ZoneOffset.ofHours(9)));

        stampHistoryMapper.save(history);
    }
}
