package com.example.teamdev.service.stamp;

import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.LocalDateTime;

/**
 * 退勤時刻の調整に特化したコンポーネント。
 * 出勤時刻より退勤時刻が前の場合に翌日の時刻として調整します。
 * 単一責任の原則に従い、時刻調整のみを責務とします。
 */
@Component
public class OutTimeAdjuster {

    /**
     * 退勤時刻を必要に応じて調整します。
     * 出勤時刻より退勤時刻が前の場合、退勤時刻を翌日として調整します。
     * 夜勤シフトなど日をまたぐ勤務を正しく処理するためのビジネスロジックです。
     *
     * @param inTime  出勤時刻
     * @param outTime 退勤時刻
     * @return 調整後の退勤時刻（調整不要またはいずれかがnullの場合は元の値）
     */
    public Timestamp adjustOutTimeIfNeeded(Timestamp inTime, Timestamp outTime) {
        // 入力値の検証
        if (!needsAdjustment(inTime, outTime)) {
            return outTime;
        }

        // 出勤時刻が退勤時刻より後の場合（日をまたぐ勤務）
        if (isInTimeAfterOutTime(inTime, outTime)) {
            return adjustToNextDay(outTime);
        }

        return outTime;
    }

    /**
     * 時刻調整が必要かどうかを判定します。
     *
     * @param inTime  出勤時刻
     * @param outTime 退勤時刻
     * @return 両方の時刻が設定されている場合true
     */
    private boolean needsAdjustment(Timestamp inTime, Timestamp outTime) {
        return inTime != null && outTime != null;
    }

    /**
     * 出勤時刻が退勤時刻より後かどうかを判定します。
     *
     * @param inTime  出勤時刻（null不可）
     * @param outTime 退勤時刻（null不可）
     * @return 出勤時刻が退勤時刻より後の場合true
     */
    private boolean isInTimeAfterOutTime(Timestamp inTime, Timestamp outTime) {
        // compareToメソッド：
        // inTimeがoutTimeより前: 負の値
        // inTimeがoutTimeと同じ: 0
        // inTimeがoutTimeより後: 正の値
        return inTime.compareTo(outTime) > 0;
    }

    /**
     * タイムスタンプを翌日の同時刻に調整します。
     *
     * @param timestamp 調整対象のタイムスタンプ
     * @return 翌日に調整されたタイムスタンプ
     */
    private Timestamp adjustToNextDay(Timestamp timestamp) {
        LocalDateTime localDateTime = timestamp.toLocalDateTime();
        LocalDateTime nextDay = localDateTime.plusDays(1);
        return Timestamp.valueOf(nextDay);
    }

    /**
     * 勤務時間を計算します（オプショナル機能）。
     * 将来的な機能拡張用のメソッドです。
     *
     * @param inTime  出勤時刻
     * @param outTime 退勤時刻（調整済み）
     * @return 勤務時間（分単位）、計算できない場合は0
     */
    public long calculateWorkingMinutes(Timestamp inTime, Timestamp outTime) {
        if (inTime == null || outTime == null) {
            return 0;
        }

        // 退勤時刻を必要に応じて調整
        Timestamp adjustedOutTime = adjustOutTimeIfNeeded(inTime, outTime);

        // ミリ秒差を分に変換
        long diffInMillis = adjustedOutTime.getTime() - inTime.getTime();
        return diffInMillis / (60 * 1000);
    }
}