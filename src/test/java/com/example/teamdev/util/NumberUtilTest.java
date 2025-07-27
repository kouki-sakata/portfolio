package com.example.teamdev.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * NumberUtilクラスのテストクラス
 * 安全な数値変換機能の動作を検証します
 */
@DisplayName("NumberUtil テスト")
class NumberUtilTest {

    @Test
    @DisplayName("正常な文字列からIntegerへの変換")
    void safeParseInt_正常な値() {
        // Given
        String validValue = "123";
        
        // When
        Optional<Integer> result = NumberUtil.safeParseInt(validValue);
        
        // Then
        assertTrue(result.isPresent());
        assertEquals(123, result.get());
    }

    @Test
    @DisplayName("無効な文字列からIntegerへの変換")
    void safeParseInt_無効な値() {
        // Given
        String invalidValue = "abc";
        
        // When
        Optional<Integer> result = NumberUtil.safeParseInt(invalidValue);
        
        // Then
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("nullまたは空文字列からIntegerへの変換")
    void safeParseInt_nullまたは空文字列() {
        // When & Then
        assertTrue(NumberUtil.safeParseInt(null).isEmpty());
        assertTrue(NumberUtil.safeParseInt("").isEmpty());
        assertTrue(NumberUtil.safeParseInt("   ").isEmpty());
    }

    @Test
    @DisplayName("デフォルト値付きの変換 - 正常値")
    void safeParseInt_デフォルト値付き_正常値() {
        // Given
        String validValue = "456";
        Integer defaultValue = 999;
        
        // When
        Integer result = NumberUtil.safeParseInt(validValue, defaultValue);
        
        // Then
        assertEquals(456, result);
    }

    @Test
    @DisplayName("デフォルト値付きの変換 - 無効値")
    void safeParseInt_デフォルト値付き_無効値() {
        // Given
        String invalidValue = "invalid";
        Integer defaultValue = 999;
        
        // When
        Integer result = NumberUtil.safeParseInt(invalidValue, defaultValue);
        
        // Then
        assertEquals(defaultValue, result);
    }

    @Test
    @DisplayName("ObjectからIntegerへの変換 - 正常値")
    void safeObjectToInt_正常値() {
        // Given
        Object validObject = 789;
        
        // When
        Optional<Integer> result = NumberUtil.safeObjectToInt(validObject);
        
        // Then
        assertTrue(result.isPresent());
        assertEquals(789, result.get());
    }

    @Test
    @DisplayName("ObjectからIntegerへの変換 - 文字列オブジェクト")
    void safeObjectToInt_文字列オブジェクト() {
        // Given
        Object stringObject = "321";
        
        // When
        Optional<Integer> result = NumberUtil.safeObjectToInt(stringObject);
        
        // Then
        assertTrue(result.isPresent());
        assertEquals(321, result.get());
    }

    @Test
    @DisplayName("ObjectからIntegerへの変換 - null値")
    void safeObjectToInt_null値() {
        // When
        Optional<Integer> result = NumberUtil.safeObjectToInt(null);
        
        // Then
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("範囲チェック - 範囲内")
    void isInRange_範囲内() {
        // When & Then
        assertTrue(NumberUtil.isInRange(5, 1, 10));
        assertTrue(NumberUtil.isInRange(1, 1, 10)); // 境界値
        assertTrue(NumberUtil.isInRange(10, 1, 10)); // 境界値
    }

    @Test
    @DisplayName("範囲チェック - 範囲外")
    void isInRange_範囲外() {
        // When & Then
        assertFalse(NumberUtil.isInRange(0, 1, 10));
        assertFalse(NumberUtil.isInRange(11, 1, 10));
        assertFalse(NumberUtil.isInRange(null, 1, 10));
    }

    @Test
    @DisplayName("範囲チェック - min/maxがnull")
    void isInRange_minMaxがnull() {
        // When & Then
        assertTrue(NumberUtil.isInRange(5, null, null)); // 制限なし
        assertTrue(NumberUtil.isInRange(5, null, 10)); // max制限のみ
        assertTrue(NumberUtil.isInRange(5, 1, null)); // min制限のみ
    }

    @Test
    @DisplayName("正の整数チェック")
    void isPositive() {
        // When & Then
        assertTrue(NumberUtil.isPositive(1));
        assertTrue(NumberUtil.isPositive(100));
        assertFalse(NumberUtil.isPositive(0));
        assertFalse(NumberUtil.isPositive(-1));
        assertFalse(NumberUtil.isPositive(null));
    }

    @Test
    @DisplayName("非負の整数チェック")
    void isNonNegative() {
        // When & Then
        assertTrue(NumberUtil.isNonNegative(0));
        assertTrue(NumberUtil.isNonNegative(1));
        assertTrue(NumberUtil.isNonNegative(100));
        assertFalse(NumberUtil.isNonNegative(-1));
        assertFalse(NumberUtil.isNonNegative(null));
    }

    @Test
    @DisplayName("Long変換 - 正常値")
    void safeParseLong_正常値() {
        // Given
        String validValue = "9223372036854775807"; // Long.MAX_VALUE
        
        // When
        Optional<Long> result = NumberUtil.safeParseLong(validValue);
        
        // Then
        assertTrue(result.isPresent());
        assertEquals(Long.MAX_VALUE, result.get());
    }

    @Test
    @DisplayName("Double変換 - 正常値")
    void safeParseDouble_正常値() {
        // Given
        String validValue = "123.456";
        
        // When
        Optional<Double> result = NumberUtil.safeParseDouble(validValue);
        
        // Then
        assertTrue(result.isPresent());
        assertEquals(123.456, result.get(), 0.001);
    }

    @Test
    @DisplayName("空白文字を含む文字列の変換")
    void safeParseInt_空白文字付き() {
        // Given
        String valueWithSpaces = "  123  ";
        
        // When
        Optional<Integer> result = NumberUtil.safeParseInt(valueWithSpaces);
        
        // Then
        assertTrue(result.isPresent());
        assertEquals(123, result.get());
    }
}