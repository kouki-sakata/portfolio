package com.example.teamdev.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * セッション検証が必要なメソッドに付与するアノテーション
 * このアノテーションが付与されたメソッドは、AOPによる統一セッション検証が実行されます
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface SessionRequired {
    
    /**
     * セッション検証が失敗した場合のリダイレクト先URL
     * デフォルトはサインイン画面
     */
    String redirectUrl() default "/signin";
    
    /**
     * 管理者権限が必要かどうか
     * trueの場合、認証済みユーザーかつ管理者権限が必要
     */
    boolean requireAdmin() default false;
}