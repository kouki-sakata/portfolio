package com.example.teamdev.service.stamp;

import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;

/**
 * 日時文字列からTimestampへの変換に特化したコンポーネント。
 * 単一責任の原則に従い、時刻変換のみを責務とします。
 */
@Component
public class TimestampConverter {

    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("uuuu-MM-dd HH:mm")
                    .withResolverStyle(ResolverStyle.STRICT);

    /**
     * 年月日と時刻文字列をTimestampに変換します。
     *
     * @param year  年
     * @param month 月
     * @param day   日
     * @param time  時刻（HH:mm形式）
     * @return 変換されたTimestamp（timeがnullまたは空の場合はnull）
     */
    public Timestamp convertToTimestamp(String year, String month, String day, String time) {
        // 時刻が指定されていない場合はnullを返す
        if (time == null || time.isEmpty()) {
            return null;
        }

        try {
            LocalDateTime localDateTime = parseToLocalDateTime(year, month, day, time);
            return Timestamp.valueOf(localDateTime);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(
                    String.format("Invalid date/time format: %s-%s-%s %s",
                            year, month, day, time), e);
        }
    }

    /**
     * 出勤時刻用のTimestamp変換メソッド。
     * ビジネスロジックに特化した名前付きメソッド。
     *
     * @param year   年
     * @param month  月
     * @param day    日
     * @param inTime 出勤時刻
     * @return 出勤時刻のTimestamp
     */
    public Timestamp convertInTime(String year, String month, String day, String inTime) {
        return convertToTimestamp(year, month, day, inTime);
    }

    /**
     * 退勤時刻用のTimestamp変換メソッド。
     * ビジネスロジックに特化した名前付きメソッド。
     *
     * @param year    年
     * @param month   月
     * @param day     日
     * @param outTime 退勤時刻
     * @return 退勤時刻のTimestamp
     */
    public Timestamp convertOutTime(String year, String month, String day, String outTime) {
        return convertToTimestamp(year, month, day, outTime);
    }

    /**
     * 年月日時刻の文字列を結合してLocalDateTimeに変換します。
     * パッケージプライベートメソッドとして、同じパッケージ内で再利用可能。
     *
     * @param year  年
     * @param month 月
     * @param day   日
     * @param time  時刻
     * @return 変換されたLocalDateTime
     */
    LocalDateTime parseToLocalDateTime(String year, String month, String day, String time) {
        // 入力値の検証
        validateDateComponents(year, month, day, time);

        try {
            // 年月日時刻の文字列を結合（月日はゼロパディング必須）
            String dateTimeString = String.format("%s-%02d-%02d %s",
                    Integer.parseInt(year),
                    Integer.parseInt(month),
                    Integer.parseInt(day),
                    time);

            // 日時文字列をLocalDateTimeに変換
            return LocalDateTime.parse(dateTimeString, DATE_TIME_FORMATTER);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(
                    String.format("Invalid date/time format: %s-%s-%s %s",
                            year, month, day, time), e);
        }
    }

    /**
     * 日付コンポーネントの基本的な検証を行います。
     *
     * @param year  年
     * @param month 月
     * @param day   日
     * @param time  時刻
     */
    private void validateDateComponents(String year, String month, String day, String time) {
        if (year == null || year.isEmpty()) {
            throw new IllegalArgumentException("Year is required");
        }
        if (month == null || month.isEmpty()) {
            throw new IllegalArgumentException("Month is required");
        }
        if (day == null || day.isEmpty()) {
            throw new IllegalArgumentException("Day is required");
        }
        if (time == null || time.isEmpty()) {
            throw new IllegalArgumentException("Time is required");
        }
    }
}