package com.example.teamdev.util;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * 日付を yyyy-MM-dd から yyyy/MM/dd 形式に変換
 *
 * @param dateStr 変換前の日付(yyyy-MM-dd形式）
 * @return 変換後の日付(yyyy / MM / dd形式 ）
 */
public class DateFormatUtil {

    // 入力フォーマット（2種類）
    private static final DateTimeFormatter INPUT_FORMAT_HYPHEN = DateTimeFormatter.ofPattern(
            "yyyy-MM-dd");
    private static final DateTimeFormatter INPUT_FORMAT_SLASH = DateTimeFormatter.ofPattern(
            "yyyy/MM/dd");

    // 出力フォーマット
    private static final DateTimeFormatter OUTPUT_FORMAT = DateTimeFormatter.ofPattern(
            "yyyy/MM/dd");

    /**
     * LocalDate型から yyyy/MM/dd 形式の文字列に変換
     *
     * @param date LocalDate型の日付
     * @return yyyy/MM/dd形式の日付文字列
     */
    public static String formatDate(LocalDate date) {
        if (date == null) {
            return null;
        }
        return date.format(OUTPUT_FORMAT);
    }

    /**
     * 文字列型の日付を yyyy/MM/dd 形式に変換
     *
     * @param dateStr yyyy-MM-dd または yyyy/MM/dd 形式の日付文字列
     * @return yyyy/MM/dd形式の日付文字列、nullの場合はnull
     */
    public static String formatDate(String dateStr) {
        if (dateStr == null) {
            return null;
        }
        // すでにスラッシュ形式ならそのまま返す
        if (dateStr.matches("\\d{4}/\\d{2}/\\d{2}")) {
            return dateStr;
        }
        // ハイフン形式で変換を試みる
        String formattedDate = tryParseDate(dateStr, INPUT_FORMAT_HYPHEN);

        // ハイフン形式で失敗したらスラッシュ形式を試す
        if (formattedDate == null) {
            formattedDate = tryParseDate(dateStr, INPUT_FORMAT_SLASH);
        }
        // どちらでも変換できない場合は元の文字列を返す
        return (formattedDate != null) ? formattedDate : dateStr;
    }

    /**
     * 指定したフォーマットでパースを試みる
     *
     * @param dateStr   入力日付
     * @param formatter フォーマッタ
     * @return 成功時はフォーマット済みの日付、失敗時はnull
     */
    private static String tryParseDate(String dateStr,
            DateTimeFormatter formatter) {
        try {
            LocalDate date = LocalDate.parse(dateStr, formatter);
            return date.format(OUTPUT_FORMAT);
        } catch (Exception e) {
            return null;  // 変換失敗時はnullを返す
        }
    }
}
