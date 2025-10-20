package com.example.teamdev.config;

import com.example.teamdev.service.PasswordMigrationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

class StartupConfigTest {

    private StartupConfig startupConfig;
    private PasswordMigrationService passwordMigrationService;

    @BeforeEach
    void setUp() {
        passwordMigrationService = mock(PasswordMigrationService.class);
        startupConfig = new StartupConfig(passwordMigrationService);
        System.clearProperty("APP_ENVIRONMENT");
    }

    @AfterEach
    void tearDown() {
        System.clearProperty("APP_ENVIRONMENT");
    }

    @Test
    void validateSecuritySecrets_allDefaultsWithBundledProductionDoesNotThrow() {
        setDefaults();
        ReflectionTestUtils.setField(startupConfig, "environment", "production");
        ReflectionTestUtils.setField(startupConfig, "securityStrictMode", false);

        assertDoesNotThrow(() -> ReflectionTestUtils.invokeMethod(startupConfig, "validateSecuritySecrets"));
    }

    @Test
    void validateSecuritySecrets_strictModeThrowsWhenDefaultsRemain() {
        setDefaults();
        ReflectionTestUtils.setField(startupConfig, "environment", "production");
        ReflectionTestUtils.setField(startupConfig, "securityStrictMode", true);

        assertThrows(
            IllegalStateException.class,
            () -> ReflectionTestUtils.invokeMethod(startupConfig, "validateSecuritySecrets")
        );
    }

    private void setDefaults() {
        Object defaultJwt = ReflectionTestUtils.getField(StartupConfig.class, "DEFAULT_JWT_SECRET");
        Object defaultEncryption = ReflectionTestUtils.getField(StartupConfig.class, "DEFAULT_ENCRYPTION_KEY");
        Object defaultPassword = ReflectionTestUtils.getField(StartupConfig.class, "DEFAULT_DB_PASSWORD");

        ReflectionTestUtils.setField(startupConfig, "jwtSecret", defaultJwt);
        ReflectionTestUtils.setField(startupConfig, "encryptionKey", defaultEncryption);
        ReflectionTestUtils.setField(startupConfig, "datasourcePassword", defaultPassword);
    }
}
