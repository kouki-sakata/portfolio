package com.example.teamdev.util;

import org.junit.jupiter.api.Test;

import java.sql.Timestamp;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * TimeFormatUtilのテストクラス
 */
class TimeFormatUtilTest {

    // ========================================
    // formatTime(Object) - null のテスト
    // ========================================

    @Test
    void formatTime_nullで空文字を返す() {
        assertEquals("", TimeFormatUtil.formatTime(null));
    }

    // ========================================
    // formatTime(Object) - Timestamp のテスト
    // ========================================

    @Test
    void formatTime_TimestampをHHmm形式に変換() {
        Timestamp timestamp = Timestamp.valueOf("2024-01-15 14:30:45");
        assertEquals("14:30", TimeFormatUtil.formatTime(timestamp));
    }

    @Test
    void formatTime_Timestamp_秒以下は切り捨て() {
        Timestamp timestamp = Timestamp.valueOf("2024-01-15 09:05:59");
        assertEquals("09:05", TimeFormatUtil.formatTime(timestamp));
    }

    @Test
    void formatTime_Timestamp_ミリ秒は無視される() {
        Timestamp timestamp = Timestamp.valueOf("2024-01-15 23:59:59.999");
        assertEquals("23:59", TimeFormatUtil.formatTime(timestamp));
    }

    // ========================================
    // formatTime(Object) - 境界値テスト
    // ========================================

    @Test
    void formatTime_境界値_0時0分() {
        Timestamp timestamp = Timestamp.valueOf("2024-01-15 00:00:00");
        assertEquals("00:00", TimeFormatUtil.formatTime(timestamp));
    }

    @Test
    void formatTime_境界値_23時59分() {
        Timestamp timestamp = Timestamp.valueOf("2024-01-15 23:59:59");
        assertEquals("23:59", TimeFormatUtil.formatTime(timestamp));
    }

    @Test
    void formatTime_境界値_正午() {
        Timestamp timestamp = Timestamp.valueOf("2024-01-15 12:00:00");
        assertEquals("12:00", TimeFormatUtil.formatTime(timestamp));
    }

    @Test
    void formatTime_境界値_午前1時() {
        Timestamp timestamp = Timestamp.valueOf("2024-01-15 01:00:00");
        assertEquals("01:00", TimeFormatUtil.formatTime(timestamp));
    }

    // ========================================
    // formatTime(Object) - String のテスト
    // ========================================

    @Test
    void formatTime_文字列が5文字以上の場合最初の5文字を返す() {
        assertEquals("12:34", TimeFormatUtil.formatTime("12:34:56"));
    }

    @Test
    void formatTime_文字列が5文字未満の場合そのまま返す() {
        assertEquals("9:00", TimeFormatUtil.formatTime("9:00"));
    }

    @Test
    void formatTime_文字列がちょうど5文字の場合そのまま返す() {
        assertEquals("10:30", TimeFormatUtil.formatTime("10:30"));
    }

    @Test
    void formatTime_空文字の場合そのまま返す() {
        assertEquals("", TimeFormatUtil.formatTime(""));
    }

    @Test
    void formatTime_文字列_1文字の場合そのまま返す() {
        assertEquals("9", TimeFormatUtil.formatTime("9"));
    }

    @Test
    void formatTime_文字列_6文字以上の場合最初の5文字を返す() {
        assertEquals("15:45", TimeFormatUtil.formatTime("15:45:30.123"));
    }

    @Test
    void formatTime_文字列_HHmm形式の場合そのまま返す() {
        assertEquals("09:15", TimeFormatUtil.formatTime("09:15"));
    }

    @Test
    void formatTime_文字列_HHmmss形式の場合HHmmに切り詰め() {
        assertEquals("23:59", TimeFormatUtil.formatTime("23:59:59"));
    }

    // ========================================
    // formatTime(Object) - 様々な入力型のテスト
    // ========================================

    @Test
    void formatTime_LocalDateTimeをtoStringした場合の挙動() {
        // LocalDateTime.toString() は "2024-01-15T14:30:00" のような形式
        // TimeFormatUtil は toString() の最初の5文字を返す
        LocalDateTime ldt = LocalDateTime.of(2024, 1, 15, 14, 30, 0);
        String result = TimeFormatUtil.formatTime(ldt.toString());
        assertEquals("2024-", result); // 最初の5文字
    }

    @Test
    void formatTime_数値を文字列化した場合() {
        assertEquals("12345", TimeFormatUtil.formatTime("123456"));
    }

    @Test
    void formatTime_特殊文字を含む文字列() {
        assertEquals("##:##", TimeFormatUtil.formatTime("##:##:##"));
    }

    // ========================================
    // formatTime(Object) - 実際のユースケース
    // ========================================

    @Test
    void formatTime_データベースから取得したTimestamp想定() {
        // 出勤時刻: 09:00:00
        Timestamp inTime = Timestamp.valueOf("2024-01-15 09:00:00");
        assertEquals("09:00", TimeFormatUtil.formatTime(inTime));

        // 退勤時刻: 18:30:45
        Timestamp outTime = Timestamp.valueOf("2024-01-15 18:30:45");
        assertEquals("18:30", TimeFormatUtil.formatTime(outTime));

        // 休憩開始: 12:00:00
        Timestamp breakStart = Timestamp.valueOf("2024-01-15 12:00:00");
        assertEquals("12:00", TimeFormatUtil.formatTime(breakStart));

        // 休憩終了: 13:00:00
        Timestamp breakEnd = Timestamp.valueOf("2024-01-15 13:00:00");
        assertEquals("13:00", TimeFormatUtil.formatTime(breakEnd));
    }

    @Test
    void formatTime_文字列形式で保存された時刻() {
        assertEquals("08:30", TimeFormatUtil.formatTime("08:30:00"));
        assertEquals("17:45", TimeFormatUtil.formatTime("17:45:30"));
    }

    // ========================================
    // formatTime(Object) - 深夜・早朝のテスト
    // ========================================

    @Test
    void formatTime_深夜0時台() {
        Timestamp timestamp = Timestamp.valueOf("2024-01-15 00:30:00");
        assertEquals("00:30", TimeFormatUtil.formatTime(timestamp));
    }

    @Test
    void formatTime_早朝5時台() {
        Timestamp timestamp = Timestamp.valueOf("2024-01-15 05:45:00");
        assertEquals("05:45", TimeFormatUtil.formatTime(timestamp));
    }

    @Test
    void formatTime_午前9時台() {
        Timestamp timestamp = Timestamp.valueOf("2024-01-15 09:00:00");
        assertEquals("09:00", TimeFormatUtil.formatTime(timestamp));
    }

    @Test
    void formatTime_夕方18時台() {
        Timestamp timestamp = Timestamp.valueOf("2024-01-15 18:30:00");
        assertEquals("18:30", TimeFormatUtil.formatTime(timestamp));
    }

    @Test
    void formatTime_夜22時台() {
        Timestamp timestamp = Timestamp.valueOf("2024-01-15 22:15:00");
        assertEquals("22:15", TimeFormatUtil.formatTime(timestamp));
    }

    // ========================================
    // formatTime(Object) - ゼロパディングの確認
    // ========================================

    @Test
    void formatTime_時間が1桁の場合ゼロパディングされる() {
        Timestamp timestamp = Timestamp.valueOf("2024-01-15 01:05:00");
        assertEquals("01:05", TimeFormatUtil.formatTime(timestamp));
    }

    @Test
    void formatTime_分が1桁の場合ゼロパディングされる() {
        Timestamp timestamp = Timestamp.valueOf("2024-01-15 10:01:00");
        assertEquals("10:01", TimeFormatUtil.formatTime(timestamp));
    }

    @Test
    void formatTime_時分ともに1桁の場合ゼロパディングされる() {
        Timestamp timestamp = Timestamp.valueOf("2024-01-15 01:01:00");
        assertEquals("01:01", TimeFormatUtil.formatTime(timestamp));
    }
}
