package com.example.teamdev.exception;

/**
 * ビジネスロジックエラーを表すカスタム例外クラス
 * アプリケーション固有のビジネスルール違反の場合に使用する
 */
public class BusinessException extends Exception {

    private String messageKey;
    private Object[] messageArgs;

    /**
     * メッセージを指定してBusinessExceptionを作成します
     * @param message エラーメッセージ
     */
    public BusinessException(String message) {
        super(message);
    }

    /**
     * メッセージと原因を指定してBusinessExceptionを作成します
     * @param message エラーメッセージ
     * @param cause 原因となった例外
     */
    public BusinessException(String message, Throwable cause) {
        super(message, cause);
    }

    /**
     * 国際化対応のメッセージキーを指定してBusinessExceptionを作成します
     * @param messageKey メッセージプロパティのキー
     * @param messageArgs メッセージパラメータ
     */
    public BusinessException(String messageKey, Object[] messageArgs) {
        super(messageKey);
        this.messageKey = messageKey;
        this.messageArgs = messageArgs;
    }

    /**
     * 国際化対応のメッセージキーと原因を指定してBusinessExceptionを作成します
     * @param messageKey メッセージプロパティのキー
     * @param messageArgs メッセージパラメータ
     * @param cause 原因となった例外
     */
    public BusinessException(String messageKey, Object[] messageArgs, Throwable cause) {
        super(messageKey, cause);
        this.messageKey = messageKey;
        this.messageArgs = messageArgs;
    }

    public String getMessageKey() {
        return messageKey;
    }

    public Object[] getMessageArgs() {
        return messageArgs;
    }
}