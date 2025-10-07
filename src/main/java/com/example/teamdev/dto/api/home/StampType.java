package com.example.teamdev.dto.api.home;

import com.example.teamdev.constant.AppConstants;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * API 上で使用する打刻種別。
 */
@Schema(description = "打刻種別", enumAsRef = true)
public enum StampType {
    /** 出勤 */
    ATTENDANCE(AppConstants.LogHistory.OPERATION_ATTENDANCE),
    /** 退勤 */
    DEPARTURE(AppConstants.LogHistory.OPERATION_DEPARTURE);

    private final int logHistoryOperationType;

    StampType(int logHistoryOperationType) {
        this.logHistoryOperationType = logHistoryOperationType;
    }

    /**
     * ログ履歴登録で使用する操作種別 ID を返します。
     */
    public int getLogHistoryOperationType() {
        return logHistoryOperationType;
    }
}

