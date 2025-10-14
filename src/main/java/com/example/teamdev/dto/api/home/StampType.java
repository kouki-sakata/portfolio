package com.example.teamdev.dto.api.home;

import com.example.teamdev.constant.AppConstants;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * API 上で使用する打刻種別。
 * JSON では "1" (出勤) または "2" (退勤) の文字列として扱われます。
 */
@Schema(description = "打刻種別", enumAsRef = true)
public enum StampType {
    /** 出勤 */
    ATTENDANCE(AppConstants.LogHistory.OPERATION_ATTENDANCE, AppConstants.Stamp.TYPE_ATTENDANCE),
    /** 退勤 */
    DEPARTURE(AppConstants.LogHistory.OPERATION_DEPARTURE, AppConstants.Stamp.TYPE_DEPARTURE);

    private final int logHistoryOperationType;
    private final String apiValue;

    StampType(int logHistoryOperationType, String apiValue) {
        this.logHistoryOperationType = logHistoryOperationType;
        this.apiValue = apiValue;
    }

    /**
     * ログ履歴登録で使用する操作種別 ID を返します。
     */
    public int getLogHistoryOperationType() {
        return logHistoryOperationType;
    }

    /**
     * JSON シリアライズ時に使用する API 値を返します。
     *
     * @return "1" (出勤) または "2" (退勤)
     */
    @JsonValue
    public String getApiValue() {
        return apiValue;
    }

    /**
     * JSON 文字列から StampType enum への変換。
     * Spring Boot の JSON デシリアライズ時に自動的に呼ばれます。
     *
     * @param value "1" (出勤) または "2" (退勤)
     * @return 対応する StampType enum
     * @throws IllegalArgumentException 不正な値の場合
     */
    @JsonCreator
    public static StampType fromValue(String value) {
        if (value == null) {
            throw new IllegalArgumentException("Stamp type must be provided");
        }
        for (StampType type : StampType.values()) {
            if (type.apiValue.equals(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException(
            "Invalid stamp type: " + value + ". Expected '1' (ATTENDANCE) or '2' (DEPARTURE)"
        );
    }
}
