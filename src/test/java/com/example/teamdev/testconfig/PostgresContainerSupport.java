package com.example.teamdev.testconfig;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import java.io.IOException;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;

public abstract class PostgresContainerSupport {

    private static final Logger log = LoggerFactory.getLogger(PostgresContainerSupport.class);
    private static final String DATABASE_NAME = "teamdev_test";
    private static final String DATABASE_USERNAME = "test_user";
    private static final String DATABASE_PASSWORD = "test_password";

    private static final PostgreSQLContainer<?> POSTGRES_CONTAINER = startContainerIfPossible();
    private static final EmbeddedPostgres EMBEDDED_POSTGRES = startEmbeddedIfNeeded();

    @DynamicPropertySource
    static void registerDataSourceProperties(DynamicPropertyRegistry registry) {
        if (POSTGRES_CONTAINER != null) {
            registry.add("spring.datasource.url", POSTGRES_CONTAINER::getJdbcUrl);
            registry.add("spring.datasource.username", POSTGRES_CONTAINER::getUsername);
            registry.add("spring.datasource.password", POSTGRES_CONTAINER::getPassword);
            registry.add("spring.datasource.driver-class-name", POSTGRES_CONTAINER::getDriverClassName);
        } else if (EMBEDDED_POSTGRES != null) {
            registry.add("spring.datasource.url", PostgresContainerSupport::buildEmbeddedJdbcUrl);
            registry.add("spring.datasource.username", () -> DATABASE_USERNAME);
            registry.add("spring.datasource.password", () -> DATABASE_PASSWORD);
            registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        } else {
            throw new IllegalStateException("利用可能なテストデータベースが見つかりません");
        }

        registry.add("spring.sql.init.mode", () -> "always");
    }

    private static EmbeddedPostgres startEmbeddedIfNeeded() {
        if (POSTGRES_CONTAINER != null) {
            return null;
        }

        try {
            EmbeddedPostgres embeddedPostgres = EmbeddedPostgres.builder()
                .setPort(0)
                .start();

            try {
                initializeEmbeddedDatabase(embeddedPostgres);
                log.info("Embedded PostgreSQL (port:{}) を起動しました", embeddedPostgres.getPort());
                return embeddedPostgres;
            } catch (Exception e) {
                closeEmbedded(embeddedPostgres);
                throw new IllegalStateException("埋め込みPostgreSQLの初期化に失敗しました", e);
            }
        } catch (IOException e) {
            throw new IllegalStateException("埋め込みPostgreSQLの起動に失敗しました", e);
        }
    }

    private static PostgreSQLContainer<?> startContainerIfPossible() {
        try {
            PostgreSQLContainer<?> container = new PostgreSQLContainer<>("postgres:16")
                .withDatabaseName(DATABASE_NAME)
                .withUsername(DATABASE_USERNAME)
                .withPassword(DATABASE_PASSWORD);

            container.start();
            log.info("Testcontainers PostgreSQL({}) を起動しました", container.getDockerImageName());
            return container;
        } catch (Exception ex) {
            log.warn("Testcontainers PostgreSQLの起動に失敗したため、埋め込みPostgreSQLへフォールバックします: {}", ex.getMessage());
            return null;
        }
    }

    private static void initializeEmbeddedDatabase(EmbeddedPostgres embeddedPostgres) {
        try (Connection connection = embeddedPostgres.getPostgresDatabase().getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("DROP DATABASE IF EXISTS " + DATABASE_NAME);
            statement.execute("DROP ROLE IF EXISTS " + DATABASE_USERNAME);
            statement.execute("CREATE ROLE " + DATABASE_USERNAME + " WITH LOGIN PASSWORD '" + DATABASE_PASSWORD + "'");
            statement.execute("CREATE DATABASE " + DATABASE_NAME + " OWNER " + DATABASE_USERNAME);
        } catch (SQLException e) {
            throw new IllegalStateException("埋め込みPostgreSQLの初期化に失敗しました", e);
        }
    }

    private static void closeEmbedded(EmbeddedPostgres embeddedPostgres) {
        try {
            embeddedPostgres.close();
        } catch (IOException e) {
            log.warn("Embedded PostgreSQLの停止に失敗しました: {}", e.getMessage());
        }
    }

    private static String buildEmbeddedJdbcUrl() {
        if (EMBEDDED_POSTGRES == null) {
            return null;
        }
        return "jdbc:postgresql://localhost:" + EMBEDDED_POSTGRES.getPort() + "/" + DATABASE_NAME;
    }
}
