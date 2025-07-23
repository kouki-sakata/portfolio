package com.example.teamdev.exception;

import java.util.Map;

/**
 * バリデーションエラーを表すカスタム例外クラス
 * フォーム入力値の検証エラーなどで使用する
 */
public class ValidationException extends Exception {

    private Map<String, String> fieldErrors;

    /**
     * メッセージを指定してValidationExceptionを作成します
     * @param message エラーメッセージ
     */
    public ValidationException(String message) {
        super(message);
    }

    /**
     * メッセージとフィールドエラーマップを指定してValidationExceptionを作成します
     * @param message エラーメッセージ
     * @param fieldErrors フィールド名をキー、エラーメッセージを値とするマップ
     */
    public ValidationException(String message, Map<String, String> fieldErrors) {
        super(message);
        this.fieldErrors = fieldErrors;
    }

    /**
     * メッセージ、フィールドエラーマップ、原因を指定してValidationExceptionを作成します
     * @param message エラーメッセージ
     * @param fieldErrors フィールド名をキー、エラーメッセージを値とするマップ
     * @param cause 原因となった例外
     */
    public ValidationException(String message, Map<String, String> fieldErrors, Throwable cause) {
        super(message, cause);
        this.fieldErrors = fieldErrors;
    }

    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }

    public void setFieldErrors(Map<String, String> fieldErrors) {
        this.fieldErrors = fieldErrors;
    }
}