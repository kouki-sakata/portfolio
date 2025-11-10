package com.example.teamdev.exception;

/**
 * 勤怠の状態遷移が不正な場合にスローされる例外
 *
 * <p>以下のような不正な操作を防止するために使用されます：</p>
 * <ul>
 *   <li>出勤打刻前に退勤打刻を試みた場合</li>
 *   <li>出勤打刻前に休憩操作を試みた場合</li>
 *   <li>退勤打刻後に休憩操作を試みた場合</li>
 * </ul>
 */
public class InvalidStampStateException extends RuntimeException {
    private final String operation;
    private final String reason;

    /**
     * InvalidStampStateExceptionを生成します
     *
     * @param operation 試行された操作（"退勤打刻"、"休憩操作" など）
     * @param reason 不正な理由（"出勤打刻が必要です" など）
     */
    public InvalidStampStateException(String operation, String reason) {
        super(String.format("%sができません: %s", operation, reason));
        this.operation = operation;
        this.reason = reason;
    }

    /**
     * 試行された操作を取得します
     *
     * @return 操作名
     */
    public String getOperation() {
        return operation;
    }

    /**
     * 不正な理由を取得します
     *
     * @return 理由
     */
    public String getReason() {
        return reason;
    }
}
