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
        return timeStr.length() >= 5 ? timeStr.substring(0, 5) : timeStr;
    }
}
