package com.example.teamdev.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * ログ出力のためのユーティリティクラス
 * 
 * 主な機能：
 * - 構造化ログの出力
 * - セキュリティ関連ログの標準化
 * - パフォーマンス測定ログ
 * - エラーログの詳細出力
 */
public class LogUtil {

    private static final String SECURITY_LOGGER = "com.example.teamdev.security";
    private static final String PERFORMANCE_LOGGER = "com.example.teamdev.performance";
    private static final String BUSINESS_LOGGER = "com.example.teamdev.business";
    
    private static final Logger securityLogger = LoggerFactory.getLogger(SECURITY_LOGGER);
    private static final Logger performanceLogger = LoggerFactory.getLogger(PERFORMANCE_LOGGER);
    private static final Logger businessLogger = LoggerFactory.getLogger(BUSINESS_LOGGER);
    
    // ログレベル定数
    public static final String LOG_LEVEL_TRACE = "TRACE";
    public static final String LOG_LEVEL_DEBUG = "DEBUG";
    public static final String LOG_LEVEL_INFO = "INFO";
    public static final String LOG_LEVEL_WARN = "WARN";
    public static final String LOG_LEVEL_ERROR = "ERROR";

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Tokyo");

    /**
     * セキュリティ関連のログを出力します
     * 
     * @param action 実行されたアクション
     * @param userId ユーザーID
     * @param result 結果（成功/失敗）
     * @param details 詳細情報
     */
    public static void logSecurity(String action, Integer userId, String result, String details) {
        try {
            MDC.put("action", action);
            MDC.put("userId", userId != null ? userId.toString() : "anonymous");
            MDC.put("result", result);
            MDC.put("timestamp", LocalDateTime.now(DEFAULT_ZONE).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            
            securityLogger.info("Security Event - Action: {}, User: {}, Result: {}, Details: {}", 
                action, userId, result, details);
        } finally {
            MDC.clear();
        }
    }

    /**
     * 認証関連のログを出力します
     * 
     * @param email ユーザーのメールアドレス
     * @param success 認証成功フラグ
     * @param ipAddress IPアドレス
     */
    public static void logAuthentication(String email, boolean success, String ipAddress) {
        String result = success ? "SUCCESS" : "FAILURE";
        String maskedEmail = maskEmail(email);
        
        logSecurity("AUTHENTICATION", null, result, 
            String.format("Email: %s, IP: %s", maskedEmail, ipAddress));
    }

    /**
     * 認可関連のログを出力します
     * 
     * @param userId ユーザーID
     * @param resource アクセスしようとしたリソース
     * @param success 認可成功フラグ
     */
    public static void logAuthorization(Integer userId, String resource, boolean success) {
        String result = success ? "GRANTED" : "DENIED";
        
        logSecurity("AUTHORIZATION", userId, result, 
            String.format("Resource: %s", resource));
    }

    /**
     * パフォーマンス測定ログを出力します
     * 
     * @param methodName メソッド名
     * @param executionTimeMs 実行時間（ミリ秒）
     * @param parameters パラメータ情報
     */
    public static void logPerformance(String methodName, long executionTimeMs, String parameters) {
        try {
            MDC.put("method", methodName);
            MDC.put("executionTime", String.valueOf(executionTimeMs));
            MDC.put("timestamp", LocalDateTime.now(DEFAULT_ZONE).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            
            if (executionTimeMs > 1000) {
                performanceLogger.warn("Slow execution - Method: {}, Time: {}ms, Params: {}", 
                    methodName, executionTimeMs, parameters);
            } else {
                performanceLogger.info("Performance - Method: {}, Time: {}ms, Params: {}", 
                    methodName, executionTimeMs, parameters);
            }
        } finally {
            MDC.clear();
        }
    }

    /**
     * ビジネスロジック関連のログを出力します
     * 
     * @param operation 実行された操作
     * @param userId ユーザーID
     * @param entityType エンティティタイプ
     * @param entityId エンティティID
     * @param result 結果
     */
    public static void logBusiness(String operation, Integer userId, String entityType, 
                                 String entityId, String result) {
        try {
            MDC.put("operation", operation);
            MDC.put("userId", userId != null ? userId.toString() : "system");
            MDC.put("entityType", entityType);
            MDC.put("entityId", entityId);
            MDC.put("result", result);
            MDC.put("timestamp", LocalDateTime.now(DEFAULT_ZONE).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            
            businessLogger.info("Business Operation - Op: {}, User: {}, Entity: {}({}), Result: {}", 
                operation, userId, entityType, entityId, result);
        } finally {
            MDC.clear();
        }
    }

    /**
     * エラーログを詳細な情報と共に出力します
     * 
     * @param logger 使用するロガー
     * @param message エラーメッセージ
     * @param exception 例外オブジェクト
     * @param userId ユーザーID
     * @param context コンテキスト情報
     */
    public static void logError(Logger logger, String message, Throwable exception, 
                               Integer userId, String context) {
        try {
            MDC.put("userId", userId != null ? userId.toString() : "unknown");
            MDC.put("context", context != null ? context : "");
            MDC.put("timestamp", LocalDateTime.now(DEFAULT_ZONE).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            
            if (exception != null) {
                logger.error("Error occurred - Message: {}, Context: {}, User: {}", 
                    message, context, userId, exception);
            } else {
                logger.error("Error occurred - Message: {}, Context: {}, User: {}", 
                    message, context, userId);
            }
        } finally {
            MDC.clear();
        }
    }

    /**
     * アプリケーション開始/終了ログを出力します
     * 
     * @param event イベント名（START/STOP）
     * @param version アプリケーションバージョン
     */
    public static void logApplicationEvent(String event, String version) {
        try {
            MDC.put("event", event);
            MDC.put("version", version != null ? version : "unknown");
            MDC.put("timestamp", LocalDateTime.now(DEFAULT_ZONE).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            
            businessLogger.info("Application Event - {}, Version: {}", event, version);
        } finally {
            MDC.clear();
        }
    }

    /**
     * メールアドレスをマスクします（ログ出力用）
     * 
     * @param email マスク対象のメールアドレス
     * @return マスクされたメールアドレス
     */
    private static String maskEmail(String email) {
        if (email == null || email.isEmpty()) {
            return "unknown";
        }
        
        int atIndex = email.indexOf('@');
        if (atIndex <= 0) {
            return "invalid";
        }
        
        String localPart = email.substring(0, atIndex);
        String domain = email.substring(atIndex);
        
        if (localPart.length() <= 3) {
            return "*".repeat(localPart.length()) + domain;
        } else {
            return localPart.substring(0, 2) + "*".repeat(localPart.length() - 2) + domain;
        }
    }

    /**
     * パフォーマンス測定を開始します
     * 
     * @return 開始時刻（ナノ秒）
     */
    public static long startPerformanceMeasurement() {
        return System.nanoTime();
    }

    /**
     * パフォーマンス測定を終了し、ログを出力します
     * 
     * @param startTime 開始時刻（ナノ秒）
     * @param methodName メソッド名
     * @param parameters パラメータ情報
     */
    public static void endPerformanceMeasurement(long startTime, String methodName, String parameters) {
        long endTime = System.nanoTime();
        long executionTimeMs = (endTime - startTime) / 1_000_000;
        logPerformance(methodName, executionTimeMs, parameters);
    }
}
