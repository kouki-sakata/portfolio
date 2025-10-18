package com.example.teamdev.config;

import com.example.teamdev.service.PasswordMigrationService;
import com.example.teamdev.util.LogUtil;
import com.example.teamdev.util.MessageUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * アプリケーション起動時の初期化処理を実行するクラス
 */
@Component
public class StartupConfig implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(StartupConfig.class);

    private final PasswordMigrationService passwordMigrationService;
    
    @Value("${spring.application.name:TeamDevelop}")
    private String applicationName;
    
    @Value("${app.version:1.0.0}")
    private String applicationVersion;
    
    @Value("${app.startup.password-migration.enabled:true}")
    private boolean passwordMigrationEnabled;
    
    @Value("${app.environment:production}")
    private String environment;

    @Autowired
    public StartupConfig(PasswordMigrationService passwordMigrationService) {
        this.passwordMigrationService = passwordMigrationService;
    }

    @Override
    public void run(String... args) throws Exception {
        // アプリケーション開始ログ
        LogUtil.logApplicationEvent("START", applicationVersion);
        logger.info("アプリケーション初期化処理開始 - {}", applicationName);
        
        long startTime = LogUtil.startPerformanceMeasurement();
        
        try {
            // パスワードマイグレーションの実行判定
            if (passwordMigrationEnabled) {
                logger.info("パスワードマイグレーション処理開始");
                passwordMigrationService.migratePasswords();
                logger.info("パスワードマイグレーション処理完了");
            } else {
                logger.info("パスワードマイグレーション処理はスキップされました（環境: {}）", environment);
            }
            
            LogUtil.logBusiness("STARTUP", null, "Application", applicationName, "SUCCESS");
            
        } catch (Exception e) {
            LogUtil.logError(logger, "アプリケーション初期化中にエラーが発生しました", e, null,
                "application=" + applicationName);
            LogUtil.logBusiness("STARTUP", null, "Application", applicationName, "FAILURE");

            // エラーの詳細をログに出力
            logger.error("例外の型: {}", e.getClass().getName());
            logger.error("例外メッセージ: {}", e.getMessage());

            if (e.getCause() != null) {
                logger.error("根本原因: {} - {}",
                    e.getCause().getClass().getName(),
                    e.getCause().getMessage());
            }

            // スタックトレースの最初の10行を出力
            StackTraceElement[] stackTrace = e.getStackTrace();
            logger.error("スタックトレース:");
            for (int i = 0; i < Math.min(10, stackTrace.length); i++) {
                logger.error("  at {}", stackTrace[i]);
            }

            // 初期化エラーでもアプリケーションは続行
            logger.warn("初期化処理でエラーが発生しましたが、アプリケーションは続行します");
        } finally {
            LogUtil.endPerformanceMeasurement(startTime, "StartupConfig.run", 
                "application=" + applicationName);
        }
        
        logger.info("アプリケーション初期化処理完了 - {}", applicationName);
    }
}