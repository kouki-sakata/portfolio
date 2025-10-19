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
            
            // 初期化エラーでもアプリケーションは続行
            logger.warn("初期化処理でエラーが発生しましたが、アプリケーションは続行します");
        } finally {
            LogUtil.endPerformanceMeasurement(startTime, "StartupConfig.run", 
                "application=" + applicationName);
        }
        
        logger.info("アプリケーション初期化処理完了 - {}", applicationName);
    }
}