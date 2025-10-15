package com.example.teamdev.service;

import com.example.teamdev.entity.Employee;
import com.example.teamdev.mapper.EmployeeMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * AuthenticationServiceの統合テスト
 *
 * Testcontainersを使用して実際のPostgreSQLコンテナを起動し、
 * モックを使わずに全レイヤーの統合をテストします。
 *
 * 検証内容:
 * - 実際のデータベース操作
 * - 実際のPasswordEncoderによるパスワード検証
 * - 実際のObjectMapperによるEmployee→Map変換
 * - サービス全体の動作フロー
 */
@SpringBootTest
@Testcontainers
@Transactional  // 各テスト後に自動ロールバックしてデータをクリーンアップ
class AuthenticationServiceIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
            .withDatabaseName("testdb")
            .withUsername("testuser")
            .withPassword("testpass");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private AuthenticationService authenticationService;

    @Autowired
    private EmployeeMapper employeeMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Employee testEmployee;

    @BeforeEach
    void setUp() {
        // テストデータの準備
        testEmployee = new Employee();
        testEmployee.setEmail("integration-test@example.com");
        testEmployee.setFirst_name("Integration");
        testEmployee.setLast_name("Test");
        testEmployee.setPassword(passwordEncoder.encode("password123"));
        testEmployee.setAdmin_flag(0);

        // 実際のDBにテストデータを投入
        employeeMapper.save(testEmployee);
    }

    @Test
    void execute_shouldReturnEmployeeMap_whenLoginIsSuccessful_withRealDatabase() {
        // Arrange
        Employee loginForm = new Employee();
        loginForm.setEmail("integration-test@example.com");
        loginForm.setPassword("password123");

        // Act - すべて実物のコンポーネントが動作
        Map<String, Object> result = authenticationService.execute(loginForm);

        // Assert - 実際のロジックが正しく動作することを検証
        assertNotNull(result, "結果がnullであってはならない");
        assertFalse(result.isEmpty(), "ログイン成功時は空のMapであってはならない");

        // 従業員情報が正しく含まれている
        assertTrue(result.containsKey("id"), "idが含まれている必要がある");
        assertEquals("integration-test@example.com", result.get("email"), "メールアドレスが一致する必要がある");
        assertEquals("Integration", result.get("first_name"), "名前が一致する必要がある");
        assertEquals("Test", result.get("last_name"), "苗字が一致する必要がある");
        assertEquals(0, result.get("admin_flag"), "管理者フラグが一致する必要がある");

        // 従業員名が正しく生成されている（実際のサービスロジック）
        assertTrue(result.containsKey("employeeName"), "employeeNameが含まれている必要がある");
        assertEquals("Integration Test", result.get("employeeName"), "従業員名は「名前 苗字」形式である必要がある");

        // サインイン時刻が記録されている
        assertTrue(result.containsKey("signInTime"), "signInTimeが含まれている必要がある");
        assertNotNull(result.get("signInTime"), "signInTimeがnullであってはならない");

        // パスワードがセキュリティのため削除されている
        assertFalse(result.containsKey("password"), "パスワードは削除されている必要がある");
    }

    @Test
    void execute_shouldReturnEmptyMap_whenPasswordIsIncorrect_withRealDatabase() {
        // Arrange
        Employee loginForm = new Employee();
        loginForm.setEmail("integration-test@example.com");
        loginForm.setPassword("wrongpassword");

        // Act - 実際のPasswordEncoderが間違ったパスワードを検証
        Map<String, Object> result = authenticationService.execute(loginForm);

        // Assert
        assertNotNull(result, "結果がnullであってはならない");
        assertTrue(result.isEmpty(), "パスワードが間違っている場合は空のMapを返す必要がある");
    }

    @Test
    void execute_shouldReturnEmptyMap_whenUserDoesNotExist_withRealDatabase() {
        // Arrange
        Employee loginForm = new Employee();
        loginForm.setEmail("nonexistent@example.com");
        loginForm.setPassword("password123");

        // Act - 実際のDBで存在しないユーザーを検索
        Map<String, Object> result = authenticationService.execute(loginForm);

        // Assert
        assertNotNull(result, "結果がnullであってはならない");
        assertTrue(result.isEmpty(), "ユーザーが存在しない場合は空のMapを返す必要がある");
    }

    @Test
    void execute_shouldReturnEmptyMap_whenEmailIsNull_withRealDatabase() {
        // Arrange
        Employee loginForm = new Employee();
        loginForm.setEmail(null);
        loginForm.setPassword("password123");

        // Act
        Map<String, Object> result = authenticationService.execute(loginForm);

        // Assert
        assertNotNull(result, "結果がnullであってはならない");
        assertTrue(result.isEmpty(), "メールアドレスがnullの場合は空のMapを返す必要がある");
    }

    @Test
    void execute_shouldHandlePasswordEncodingCorrectly_withRealDatabase() {
        // Arrange - 管理者ユーザーを作成
        Employee adminEmployee = new Employee();
        adminEmployee.setEmail("admin@example.com");
        adminEmployee.setFirst_name("Admin");
        adminEmployee.setLast_name("User");
        adminEmployee.setPassword(passwordEncoder.encode("adminpass"));
        adminEmployee.setAdmin_flag(1);
        employeeMapper.save(adminEmployee);

        Employee loginForm = new Employee();
        loginForm.setEmail("admin@example.com");
        loginForm.setPassword("adminpass");

        // Act
        Map<String, Object> result = authenticationService.execute(loginForm);

        // Assert - 実際のBCryptエンコーディングが正しく動作していることを検証
        assertNotNull(result);
        assertFalse(result.isEmpty());
        assertEquals(1, result.get("admin_flag"), "管理者フラグが正しく取得できる");
        assertEquals("Admin User", result.get("employeeName"), "管理者の従業員名が正しく生成される");
    }
}
