package com.example.demo.service;

import com.example.teamdev.entity.Employee;
import com.example.teamdev.mapper.EmployeeMapper;
import com.example.teamdev.service.AuthenticationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class HomeService03Test {

    @Mock
    private EmployeeMapper employeeMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    // 実物のObjectMapperを使用（モックではなく実際の変換ロジックをテスト）
    private ObjectMapper objectMapper;

    private AuthenticationService homeService03;
    private Clock fixedClock;

    private Employee employeeFrom;
    private Employee storedEmployee;

    @BeforeEach
    void setUp() {
        // ObjectMapperの実物インスタンスを作成
        objectMapper = new ObjectMapper();
        fixedClock = Clock.fixed(Instant.parse("2025-10-01T00:00:00Z"), ZoneId.of("Asia/Tokyo"));

        // AuthenticationServiceを手動で構築（実物のObjectMapperを注入）
        homeService03 = new AuthenticationService(employeeMapper, passwordEncoder, objectMapper, fixedClock);

        employeeFrom = new Employee();
        employeeFrom.setEmail("test@example.com");
        employeeFrom.setPassword("plainPassword123");

        storedEmployee = new Employee();
        storedEmployee.setId(1);
        storedEmployee.setEmail("test@example.com");
        storedEmployee.setFirst_name("Test");
        storedEmployee.setLast_name("User");
        // Stored password is now hashed for the test
        storedEmployee.setPassword("$2a$10$hashedpassword");
        storedEmployee.setAdmin_flag(0);
    }

    @Test
    void execute_shouldReturnEmployeeMap_whenLoginIsSuccessful() {
        // Arrange
        when(employeeMapper.getEmployeeByEmail("test@example.com")).thenReturn(storedEmployee);
        when(passwordEncoder.matches("plainPassword123", "$2a$10$hashedpassword")).thenReturn(true);
        // ObjectMapperは実物を使用 - 実際の変換ロジックがテストされる

        // Act
        Map<String, Object> result = homeService03.execute(employeeFrom);

        // Assert
        assertNotNull(result);
        assertTrue(result.containsKey("employeeName"));
        assertEquals("Test User", result.get("employeeName"));
        assertTrue(result.containsKey("signInTime"));
        assertFalse(result.containsKey("password"));
        assertEquals(1, result.get("id"));
        // 実際のJackson変換により、すべてのフィールドが正しく変換されることを検証
        assertEquals("test@example.com", result.get("email"));
        assertEquals("Test", result.get("first_name"));
        assertEquals("User", result.get("last_name"));
        assertEquals(0, result.get("admin_flag"));
    }

    @Test
    void execute_shouldReturnEmptyMap_whenPasswordDoesNotMatch() {
        // Arrange
        when(employeeMapper.getEmployeeByEmail("test@example.com")).thenReturn(storedEmployee);
        when(passwordEncoder.matches("plainPassword123", "$2a$10$hashedpassword")).thenReturn(false);

        // Act
        Map<String, Object> result = homeService03.execute(employeeFrom);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void execute_shouldReturnEmptyMap_whenUserNotFound() {
        // Arrange
        when(employeeMapper.getEmployeeByEmail("test@example.com")).thenReturn(null);

        // Act
        Map<String, Object> result = homeService03.execute(employeeFrom);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void execute_shouldReturnEmptyMap_whenEmailInFormIsNull() {
        // Arrange
        employeeFrom.setEmail(null);
        when(employeeMapper.getEmployeeByEmail(null)).thenReturn(null);

        // Act
        Map<String, Object> result = homeService03.execute(employeeFrom);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void execute_shouldReturnEmptyMap_whenPasswordInFormIsNull() {
        // Arrange
        employeeFrom.setPassword(null);
        when(employeeMapper.getEmployeeByEmail("test@example.com")).thenReturn(storedEmployee);
        when(passwordEncoder.matches(null, "$2a$10$hashedpassword")).thenReturn(false);

        // Act
        Map<String, Object> result = homeService03.execute(employeeFrom);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }
}
