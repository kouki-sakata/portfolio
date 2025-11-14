package com.example.teamdev.util;

import java.sql.Timestamp;
import java.time.format.DateTimeFormatter;

public class TimeFormatUtil {

    public static String formatTime(Object time) {
        if (time == null) {
            return "";
        }
        if (time instanceof Timestamp) {
            return ((Timestamp) time).toLocalDateTime().format(DateTimeFormatter.ofPattern("HH:mm"));
        }
        String timeStr = time.toString();

        // 時刻フォーマットの検証（HH:mm または HH:mm:ss）
        // 時間: 00-23, 分: 00-59, 秒: 00-59（オプション）
        if (timeStr.matches("^([01]?\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$")) {
            return timeStr.length() >= 5 ? timeStr.substring(0, 5) : timeStr;
        }

        // 無効なフォーマットの場合は空文字列を返す
        return "";
    }
}
