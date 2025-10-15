package com.example.teamdev.exception;

/**
 * 既に設定されている打刻時刻の上書きを試みた場合にスローされる例外
 *
 * <p>通信再送や誤タップによる重複打刻を防止し、勤怠記録の改ざんを防ぐために使用されます。</p>
 */
public class DuplicateStampException extends RuntimeException {
    private final String stampType;
    private final String existingTime;

    /**
     * DuplicateStampExceptionを生成します
     *
     * @param stampType 打刻種別（"出勤" または "退勤"）
     * @param existingTime 既に登録されている打刻時刻
     */
    public DuplicateStampException(String stampType, String existingTime) {
        super(String.format("打刻時刻が既に登録されています: %s (%s)", stampType, existingTime));
        this.stampType = stampType;
        this.existingTime = existingTime;
    }

    /**
     * 打刻種別を取得します
     *
     * @return 打刻種別（"出勤" または "退勤"）
     */
    public String getStampType() {
        return stampType;
    }

    /**
     * 既に登録されている打刻時刻を取得します
     *
     * @return 既存の打刻時刻
     */
    public String getExistingTime() {
        return existingTime;
    }
}
