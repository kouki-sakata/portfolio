package com.example.teamdev.util;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * 国際化メッセージを取得するためのユーティリティクラス
 */
@Component
public class MessageUtil {

    private static MessageSource messageSource;

    @Autowired
    public MessageUtil(MessageSource messageSource) {
        MessageUtil.messageSource = messageSource;
    }

    /**
     * 現在のロケールでメッセージを取得します
     * @param key メッセージキー
     * @return ローカライズされたメッセージ
     */
    public static String getMessage(String key) {
        return getMessage(key, null);
    }

    /**
     * 現在のロケールでパラメータ付きメッセージを取得します
     * @param key メッセージキー
     * @param args メッセージパラメータ
     * @return ローカライズされたメッセージ
     */
    public static String getMessage(String key, Object[] args) {
        return getMessage(key, args, LocaleContextHolder.getLocale());
    }

    /**
     * 指定されたロケールでメッセージを取得します
     * @param key メッセージキー
     * @param args メッセージパラメータ
     * @param locale ロケール
     * @return ローカライズされたメッセージ
     */
    public static String getMessage(String key, Object[] args, Locale locale) {
        try {
            return messageSource.getMessage(key, args, locale);
        } catch (Exception e) {
            // メッセージが見つからない場合はキー自体を返す
            return key;
        }
    }

    /**
     * 日本語でメッセージを取得します
     * @param key メッセージキー
     * @return 日本語メッセージ
     */
    public static String getMessageJa(String key) {
        return getMessageJa(key, null);
    }

    /**
     * 日本語でパラメータ付きメッセージを取得します
     * @param key メッセージキー
     * @param args メッセージパラメータ
     * @return 日本語メッセージ
     */
    public static String getMessageJa(String key, Object[] args) {
        return getMessage(key, args, Locale.JAPAN);
    }

    /**
     * 英語でメッセージを取得します
     * @param key メッセージキー
     * @return 英語メッセージ
     */
    public static String getMessageEn(String key) {
        return getMessageEn(key, null);
    }

    /**
     * 英語でパラメータ付きメッセージを取得します
     * @param key メッセージキー
     * @param args メッセージパラメータ
     * @return 英語メッセージ
     */
    public static String getMessageEn(String key, Object[] args) {
        return getMessage(key, args, Locale.ENGLISH);
    }
}