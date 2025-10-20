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

    private static final String DEFAULT_JWT_SECRET = "default-secret-key-change-in-production";
    private static final String DEFAULT_ENCRYPTION_KEY = "default-encryption-key";
    private static final String DEFAULT_DB_PASSWORD = "password";

    private final PasswordMigrationService passwordMigrationService;
    
    @Value("${spring.application.name:TeamDevelop}")
    private String applicationName;
    
    @Value("${app.version:1.0.0}")
    private String applicationVersion;
    
    @Value("${app.startup.password-migration.enabled:true}")
    private boolean passwordMigrationEnabled;

    @Value("${app.environment:production}")
    private String environment;

    @Value("${app.startup.security-strict:false}")
    private boolean securityStrictMode;

    @Value("${security.jwt.secret}")
    private String jwtSecret;

    @Value("${security.encryption.key}")
    private String encryptionKey;

    @Value("${spring.datasource.password}")
    private String datasourcePassword;

    @Autowired
    public StartupConfig(PasswordMigrationService passwordMigrationService) {
        this.passwordMigrationService = passwordMigrationService;
    }

    @Override
    public void run(String... args) throws Exception {
        validateSecuritySecrets();

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

    private void validateSecuritySecrets() {
        boolean jwtDefault = DEFAULT_JWT_SECRET.equals(jwtSecret);
        boolean encryptionDefault = DEFAULT_ENCRYPTION_KEY.equals(encryptionKey);
        boolean datasourceDefault = DEFAULT_DB_PASSWORD.equals(datasourcePassword);

        boolean hasAnyDefault = jwtDefault || encryptionDefault || datasourceDefault;
        if (!hasAnyDefault) {
            return;
        }

        boolean production = isProductionEnvironment();
        boolean usingBundledDefaults = jwtDefault && encryptionDefault && datasourceDefault;
        boolean environmentOverridden = isEnvironmentPropertyOverridden();

        if (production && usingBundledDefaults && !environmentOverridden && !securityStrictMode) {
            logger.warn(
                "app.environment がデフォルトの production のままですが、バンドルされたセキュリティキー/パスワードで起動しています。" +
                "ローカル開発向けのデフォルト構成として起動を継続しますが、本番運用前に必ず環境変数で上書きしてください。"
            );
            return;
        }

        if (securityStrictMode) {
            logger.error(
                "セキュリティキー/パスワードがデフォルト値のままです (environment={}, strictMode=true)",
                environment
            );
            throw new IllegalStateException("安全な運用のため、JWT/暗号鍵/DBパスワードを環境変数で上書きしてください");
        }

        if (production) {
            logger.warn(
                "セキュリティキー/パスワードがデフォルト値のままです (environment={}). 本番運用時は環境変数で上書きしてください",
                environment
            );
        } else {
            logger.warn(
                "{} 環境でセキュリティキー/パスワードがデフォルト値のままです。必要に応じて環境変数を設定してください",
                environment
            );
        }
    }

    private boolean isProductionEnvironment() {
        if (environment == null) {
            return true;
        }
        String normalized = environment.trim().toLowerCase();
        return normalized.equals("production") || normalized.equals("prod");
    }

    private boolean isEnvironmentPropertyOverridden() {
        return System.getenv().containsKey("APP_ENVIRONMENT")
            || System.getProperty("APP_ENVIRONMENT") != null;
    }
}
