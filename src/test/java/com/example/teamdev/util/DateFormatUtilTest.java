package com.example.teamdev.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

/**
 * DateFormatUtilのテストクラス
 */
class DateFormatUtilTest {

    // ========================================
    // formatDate(LocalDate) のテスト
    // ========================================

    @Test
    void formatDate_LocalDateから正しく変換される() {
        LocalDate date = LocalDate.of(2024, 1, 15);
        assertEquals("2024/01/15", DateFormatUtil.formatDate(date));
    }

    @Test
    void formatDate_nullのLocalDateでnullを返す() {
        assertNull(DateFormatUtil.formatDate((LocalDate) null));
    }

    @Test
    void formatDate_年初を正しく処理() {
        LocalDate date = LocalDate.of(2024, 1, 1);
        assertEquals("2024/01/01", DateFormatUtil.formatDate(date));
    }

    @Test
    void formatDate_年末を正しく処理() {
        LocalDate date = LocalDate.of(2024, 12, 31);
        assertEquals("2024/12/31", DateFormatUtil.formatDate(date));
    }

    @Test
    void formatDate_閏年の2月29日を正しく処理() {
        LocalDate date = LocalDate.of(2024, 2, 29);
        assertEquals("2024/02/29", DateFormatUtil.formatDate(date));
    }

    // ========================================
    // formatDate(String) - ハイフン形式のテスト
    // ========================================

    @Test
    void formatDate_ハイフン形式をスラッシュ形式に変換() {
        assertEquals("2024/01/15", DateFormatUtil.formatDate("2024-01-15"));
    }

    @Test
    void formatDate_ハイフン形式_月末日付を正しく処理() {
        assertEquals("2024/02/29", DateFormatUtil.formatDate("2024-02-29")); // 閏年
        assertEquals("2023/02/28", DateFormatUtil.formatDate("2023-02-28")); // 平年
    }

    @Test
    void formatDate_ハイフン形式_年初年末を正しく処理() {
        assertEquals("2024/01/01", DateFormatUtil.formatDate("2024-01-01"));
        assertEquals("2024/12/31", DateFormatUtil.formatDate("2024-12-31"));
    }

    // ========================================
    // formatDate(String) - スラッシュ形式のテスト
    // ========================================

    @Test
    void formatDate_スラッシュ形式はそのまま返す() {
        assertEquals("2024/01/15", DateFormatUtil.formatDate("2024/01/15"));
    }

    @Test
    void formatDate_スラッシュ形式_既に正しい形式の場合変換不要() {
        String expected = "2024/12/31";
        assertEquals(expected, DateFormatUtil.formatDate(expected));
    }

    // ========================================
    // formatDate(String) - 異常系・エッジケース
    // ========================================

    @Test
    void formatDate_nullを渡すとnullを返す() {
        assertNull(DateFormatUtil.formatDate((String) null));
    }

    @Test
    void formatDate_不正なフォーマットは元の文字列を返す() {
        String invalid = "2024年1月15日";
        assertEquals(invalid, DateFormatUtil.formatDate(invalid));
    }

    @Test
    void formatDate_空文字は元の文字列を返す() {
        String empty = "";
        assertEquals(empty, DateFormatUtil.formatDate(empty));
    }

    @Test
    void formatDate_不正な日付_13月は元の文字列を返す() {
        String invalid = "2024-13-01";
        assertEquals(invalid, DateFormatUtil.formatDate(invalid));
    }

    @Test
    void formatDate_不正な日付_平年の2月29日は元の文字列を返す() {
        String invalid = "2023-02-29";
        assertEquals(invalid, DateFormatUtil.formatDate(invalid));
    }

    @Test
    void formatDate_不正な日付_32日は元の文字列を返す() {
        String invalid = "2024-01-32";
        assertEquals(invalid, DateFormatUtil.formatDate(invalid));
    }

    @Test
    void formatDate_数値のみの文字列は元の文字列を返す() {
        String invalid = "20240115";
        assertEquals(invalid, DateFormatUtil.formatDate(invalid));
    }

    @Test
    void formatDate_区切り文字なしは元の文字列を返す() {
        String invalid = "2024 01 15";
        assertEquals(invalid, DateFormatUtil.formatDate(invalid));
    }

    // ========================================
    // パラメータ化テスト
    // ========================================

    @ParameterizedTest
    @CsvSource({
        "2024-01-01, 2024/01/01",
        "2024-12-31, 2024/12/31",
        "2024/06/15, 2024/06/15",
        "2024-02-29, 2024/02/29",  // 閏年
        "2023-02-28, 2023/02/28",  // 平年
        "invalid-date, invalid-date",
        "2024年1月1日, 2024年1月1日",
        "'', ''"
    })
    void formatDate_パラメータ化テスト(String input, String expected) {
        assertEquals(expected, DateFormatUtil.formatDate(input));
    }

    // ========================================
    // 境界値テスト
    // ========================================

    @Test
    void formatDate_最小年を正しく処理() {
        LocalDate date = LocalDate.of(1, 1, 1);
        assertEquals("0001/01/01", DateFormatUtil.formatDate(date));
    }

    @Test
    void formatDate_大きな年を正しく処理() {
        LocalDate date = LocalDate.of(9999, 12, 31);
        assertEquals("9999/12/31", DateFormatUtil.formatDate(date));
    }

    @Test
    void formatDate_各月の最終日を正しく処理() {
        assertEquals("2024/01/31", DateFormatUtil.formatDate("2024-01-31")); // 1月
        assertEquals("2024/02/29", DateFormatUtil.formatDate("2024-02-29")); // 2月（閏年）
        assertEquals("2024/03/31", DateFormatUtil.formatDate("2024-03-31")); // 3月
        assertEquals("2024/04/30", DateFormatUtil.formatDate("2024-04-30")); // 4月
        assertEquals("2024/05/31", DateFormatUtil.formatDate("2024-05-31")); // 5月
        assertEquals("2024/06/30", DateFormatUtil.formatDate("2024-06-30")); // 6月
        assertEquals("2024/07/31", DateFormatUtil.formatDate("2024-07-31")); // 7月
        assertEquals("2024/08/31", DateFormatUtil.formatDate("2024-08-31")); // 8月
        assertEquals("2024/09/30", DateFormatUtil.formatDate("2024-09-30")); // 9月
        assertEquals("2024/10/31", DateFormatUtil.formatDate("2024-10-31")); // 10月
        assertEquals("2024/11/30", DateFormatUtil.formatDate("2024-11-30")); // 11月
        assertEquals("2024/12/31", DateFormatUtil.formatDate("2024-12-31")); // 12月
    }
}
