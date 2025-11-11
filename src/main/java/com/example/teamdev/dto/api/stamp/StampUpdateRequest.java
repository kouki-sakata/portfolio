package com.example.teamdev.dto.api.stamp;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Pattern;

/**
 * 打刻履歴更新用リクエストDTO。
 */
public record StampUpdateRequest(
    @Pattern(
        regexp = "^([0-1][0-9]|2[0-3]):[0-5][0-9]$",
        message = "inTime must match HH:mm format"
    )
    String inTime,
    @Pattern(
        regexp = "^([0-1][0-9]|2[0-3]):[0-5][0-9]$",
        message = "outTime must match HH:mm format"
    )
    String outTime,
    @Pattern(
        regexp = "^([0-1][0-9]|2[0-3]):[0-5][0-9]$",
        message = "breakStartTime must match HH:mm format"
    )
    String breakStartTime,
    @Pattern(
        regexp = "^([0-1][0-9]|2[0-3]):[0-5][0-9]$",
        message = "breakEndTime must match HH:mm format"
    )
    String breakEndTime,
    Boolean isNightShift
) {
    @AssertTrue(message = "At least one field must be provided")
    public boolean hasUpdatableField() {
        return (inTime != null && !inTime.isBlank())
            || (outTime != null && !outTime.isBlank())
            || breakStartTime != null
            || breakEndTime != null
            || isNightShift != null;
    }

    @AssertTrue(message = "Break end time must be after break start time")
    public boolean isBreakTimeValid() {
        // 両方の休憩時間が指定されている場合のみ検証
        if (breakStartTime != null && !breakStartTime.isBlank()
            && breakEndTime != null && !breakEndTime.isBlank()) {
            try {
                java.time.LocalTime start = java.time.LocalTime.parse(breakStartTime);
                java.time.LocalTime end = java.time.LocalTime.parse(breakEndTime);
                return end.isAfter(start);
            } catch (java.time.format.DateTimeParseException e) {
                // パースエラーは別のバリデーションで検出される
                return true;
            }
        }
        return true;
    }
}
