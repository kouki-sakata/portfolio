package com.example.teamdev.service.stamp;

import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.LocalDate;
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
     * 日付と時刻文字列をTimestampに変換します。
     *
     * @param date 打刻日付
     * @param time 時刻（HH:mm形式）
     * @return 変換されたTimestamp（timeがnullまたは空の場合はnull）
     */
    public Timestamp convertToTimestamp(LocalDate date, String time) {
        // 時刻が指定されていない場合はnullを返す
        if (time == null || time.isEmpty()) {
            return null;
        }

        try {
            LocalDateTime localDateTime = parseToLocalDateTime(date, time);
            return Timestamp.valueOf(localDateTime);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(
                    String.format("Invalid date/time format: %s %s", date, time), e);
        }
    }

    /**
     * 出勤時刻用のTimestamp変換メソッド。
     * ビジネスロジックに特化した名前付きメソッド。
     *
     * @param date   打刻日付
     * @param inTime 出勤時刻
     * @return 出勤時刻のTimestamp
     */
    public Timestamp convertInTime(LocalDate date, String inTime) {
        return convertToTimestamp(date, inTime);
    }

    /**
     * 退勤時刻用のTimestamp変換メソッド。
     * ビジネスロジックに特化した名前付きメソッド。
     *
     * @param date    打刻日付
     * @param outTime 退勤時刻
     * @return 退勤時刻のTimestamp
     */
    public Timestamp convertOutTime(LocalDate date, String outTime) {
        return convertToTimestamp(date, outTime);
    }

    /**
     * 日付と時刻を結合してLocalDateTimeに変換します。
     * パッケージプライベートメソッドとして、同じパッケージ内で再利用可能。
     *
     * @param date 打刻日付
     * @param time 時刻
     * @return 変換されたLocalDateTime
     */
    LocalDateTime parseToLocalDateTime(LocalDate date, String time) {
        // 入力値の検証
        validateDateComponents(date, time);

        // 日付と時刻を結合してLocalDateTimeに変換
        String dateTimeString = String.format("%s %s", date.toString(), time);

        // 日時文字列をLocalDateTimeに変換
        return LocalDateTime.parse(dateTimeString, DATE_TIME_FORMATTER);
    }

    /**
     * 日付コンポーネントの基本的な検証を行います。
     *
     * @param date 打刻日付
     * @param time 時刻
     */
    private void validateDateComponents(LocalDate date, String time) {
        if (date == null) {
            throw new IllegalArgumentException("Date is required");
        }
        if (time == null || time.isEmpty()) {
            throw new IllegalArgumentException("Time is required");
        }
    }
}