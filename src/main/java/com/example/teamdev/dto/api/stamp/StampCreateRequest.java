package com.example.teamdev.dto.api.stamp;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * 打刻履歴新規作成用リクエストDTO。
 */
public record StampCreateRequest(
    @NotNull(message = "従業員IDは必須です")
    Integer employeeId,
    @NotBlank(message = "年は必須です")
    @Pattern(
        regexp = "^\\d{4}$",
        message = "年はYYYY形式で指定してください"
    )
    String year,
    @NotBlank(message = "月は必須です")
    @Pattern(
        regexp = "^(0?[1-9]|1[0-2])$",
        message = "月は1-12の範囲で指定してください（ゼロパディング可）"
    )
    String month,
    @NotBlank(message = "日は必須です")
    @Pattern(
        regexp = "^(0?[1-9]|[12][0-9]|3[01])$",
        message = "日は1-31の範囲で指定してください（ゼロパディング可）"
    )
    String day,
    @Pattern(
        regexp = "^([0-1][0-9]|2[0-3]):[0-5][0-9]$",
        message = "出勤時刻はHH:mm形式で指定してください"
    )
    String inTime,
    @Pattern(
        regexp = "^([0-1][0-9]|2[0-3]):[0-5][0-9]$",
        message = "退勤時刻はHH:mm形式で指定してください"
    )
    String outTime,
    @Pattern(
        regexp = "^([0-1][0-9]|2[0-3]):[0-5][0-9]$",
        message = "休憩開始時刻はHH:mm形式で指定してください"
    )
    String breakStartTime,
    @Pattern(
        regexp = "^([0-1][0-9]|2[0-3]):[0-5][0-9]$",
        message = "休憩終了時刻はHH:mm形式で指定してください"
    )
    String breakEndTime,
    Boolean isNightShift
) {
    @AssertTrue(message = "出勤時刻または退勤時刻のいずれかを指定してください")
    public boolean hasTimeField() {
        return (inTime != null && !inTime.isBlank())
            || (outTime != null && !outTime.isBlank());
    }

    @AssertTrue(message = "出勤時刻と退勤時刻の関係が不正です。通常勤務の場合、退勤時刻は出勤時刻より後である必要があります")
    public boolean isWorkTimeValid() {
        // 両方の時刻が指定されている場合のみ検証
        if (inTime != null && !inTime.isBlank()
            && outTime != null && !outTime.isBlank()) {
            try {
                java.time.LocalTime in = java.time.LocalTime.parse(inTime);
                java.time.LocalTime out = java.time.LocalTime.parse(outTime);

                // 夜勤フラグがtrueの場合は日をまたぐため、out < inを許可
                // 夜勤フラグがfalse/nullの場合は、out > inを要求
                if (Boolean.TRUE.equals(isNightShift)) {
                    // 夜勤の場合は時間の逆転を許可（日跨ぎ）
                    return true;
                } else {
                    // 通常勤務の場合は退勤時刻が出勤時刻より後である必要がある
                    return out.isAfter(in);
                }
            } catch (java.time.format.DateTimeParseException e) {
                // パースエラーは別のバリデーションで検出される
                return true;
            }
        }
        return true;
    }

    @AssertTrue(message = "休憩時間が不正です。通常勤務の場合、休憩終了時刻は休憩開始時刻より後である必要があります")
    public boolean isBreakTimeValid() {
        // 両方の休憩時間が指定されている場合のみ検証
        if (breakStartTime != null && !breakStartTime.isBlank()
            && breakEndTime != null && !breakEndTime.isBlank()) {
            try {
                java.time.LocalTime start = java.time.LocalTime.parse(breakStartTime);
                java.time.LocalTime end = java.time.LocalTime.parse(breakEndTime);

                // 夜勤フラグがtrueの場合は日をまたぐため、end < startを許可
                // 夜勤フラグがfalse/nullの場合は、end > startを要求
                if (Boolean.TRUE.equals(isNightShift)) {
                    // 夜勤の場合は時間の逆転を許可（日跨ぎ）
                    return true;
                } else {
                    // 通常勤務の場合は休憩終了時刻が休憩開始時刻より後である必要がある
                    return end.isAfter(start);
                }
            } catch (java.time.format.DateTimeParseException e) {
                // パースエラーは別のバリデーションで検出される
                return true;
            }
        }
        return true;
    }
}
