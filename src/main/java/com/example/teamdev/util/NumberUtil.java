package com.example.teamdev.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

/**
 * 数値変換を安全に行うためのユーティリティクラス
 * NumberFormatExceptionを防止し、安全な数値変換を提供します
 */
public class NumberUtil {

    private static final Logger logger = LoggerFactory.getLogger(NumberUtil.class);

    /**
     * 文字列をIntegerに安全に変換します
     *
     * @param value 変換対象の文字列
     * @return 変換に成功した場合はOptional.of(Integer)、失敗した場合はOptional.empty()
     */
    public static Optional<Integer> safeParseInt(String value) {
        if (value == null || value.trim().isEmpty()) {
            logger.debug("変換対象の文字列がnullまたは空です");
            return Optional.empty();
        }
        
        try {
            return Optional.of(Integer.parseInt(value.trim()));
        } catch (NumberFormatException e) {
            logger.warn("文字列をIntegerに変換できませんでした。値: '{}', エラー: {}", value, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * 文字列をIntegerに安全に変換し、デフォルト値を返します
     *
     * @param value        変換対象の文字列
     * @param defaultValue 変換に失敗した場合のデフォルト値
     * @return 変換に成功した場合は変換後の値、失敗した場合はデフォルト値
     */
    public static Integer safeParseInt(String value, Integer defaultValue) {
        return safeParseInt(value).orElse(defaultValue);
    }

    /**
     * 文字列をLongに安全に変換します
     *
     * @param value 変換対象の文字列
     * @return 変換に成功した場合はOptional.of(Long)、失敗した場合はOptional.empty()
     */
    public static Optional<Long> safeParseLong(String value) {
        if (value == null || value.trim().isEmpty()) {
            logger.debug("変換対象の文字列がnullまたは空です");
            return Optional.empty();
        }
        
        try {
            return Optional.of(Long.parseLong(value.trim()));
        } catch (NumberFormatException e) {
            logger.warn("文字列をLongに変換できませんでした。値: '{}', エラー: {}", value, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * 文字列をLongに安全に変換し、デフォルト値を返します
     *
     * @param value        変換対象の文字列
     * @param defaultValue 変換に失敗した場合のデフォルト値
     * @return 変換に成功した場合は変換後の値、失敗した場合はデフォルト値
     */
    public static Long safeParseLong(String value, Long defaultValue) {
        return safeParseLong(value).orElse(defaultValue);
    }

    /**
     * 文字列をDoubleに安全に変換します
     *
     * @param value 変換対象の文字列
     * @return 変換に成功した場合はOptional.of(Double)、失敗した場合はOptional.empty()
     */
    public static Optional<Double> safeParseDouble(String value) {
        if (value == null || value.trim().isEmpty()) {
            logger.debug("変換対象の文字列がnullまたは空です");
            return Optional.empty();
        }
        
        try {
            return Optional.of(Double.parseDouble(value.trim()));
        } catch (NumberFormatException e) {
            logger.warn("文字列をDoubleに変換できませんでした。値: '{}', エラー: {}", value, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * 文字列をDoubleに安全に変換し、デフォルト値を返します
     *
     * @param value        変換対象の文字列
     * @param defaultValue 変換に失敗した場合のデフォルト値
     * @return 変換に成功した場合は変換後の値、失敗した場合はデフォルト値
     */
    public static Double safeParseDouble(String value, Double defaultValue) {
        return safeParseDouble(value).orElse(defaultValue);
    }

    /**
     * Objectから文字列に変換してからIntegerに安全に変換します
     * セッション値等のObject型に対して使用
     *
     * @param value 変換対象のObject
     * @return 変換に成功した場合はOptional.of(Integer)、失敗した場合はOptional.empty()
     */
    public static Optional<Integer> safeObjectToInt(Object value) {
        if (value == null) {
            logger.debug("変換対象のObjectがnullです");
            return Optional.empty();
        }
        return safeParseInt(value.toString());
    }

    /**
     * Objectから文字列に変換してからIntegerに安全に変換し、デフォルト値を返します
     *
     * @param value        変換対象のObject
     * @param defaultValue 変換に失敗した場合のデフォルト値
     * @return 変換に成功した場合は変換後の値、失敗した場合はデフォルト値
     */
    public static Integer safeObjectToInt(Object value, Integer defaultValue) {
        return safeObjectToInt(value).orElse(defaultValue);
    }

    /**
     * 数値が指定された範囲内にあるかチェックします
     *
     * @param value 検証対象の値
     * @param min   最小値（inclusive）
     * @param max   最大値（inclusive）
     * @return 範囲内の場合true、範囲外の場合false
     */
    public static boolean isInRange(Integer value, Integer min, Integer max) {
        if (value == null) {
            return false;
        }
        
        boolean inRange = (min == null || value >= min) && (max == null || value <= max);
        if (!inRange) {
            logger.debug("値が範囲外です。値: {}, 範囲: [{}, {}]", value, min, max);
        }
        
        return inRange;
    }

    /**
     * 正の整数かどうかチェックします
     *
     * @param value 検証対象の値
     * @return 正の整数の場合true、それ以外の場合false
     */
    public static boolean isPositive(Integer value) {
        return value != null && value > 0;
    }

    /**
     * 非負の整数かどうかチェックします
     *
     * @param value 検証対象の値
     * @return 非負の整数の場合true、それ以外の場合false
     */
    public static boolean isNonNegative(Integer value) {
        return value != null && value >= 0;
    }
}