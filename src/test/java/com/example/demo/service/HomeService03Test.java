package com.example.demo.service;

import com.example.teamdev.entity.Employee;
import com.example.teamdev.mapper.EmployeeMapper;
import com.example.teamdev.service.AuthenticationService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class HomeService03Test {

    @Mock
    private EmployeeMapper employeeMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthenticationService homeService03;

    private Employee employeeFrom;
    private Employee storedEmployee;

    @BeforeEach
    void setUp() {
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

        // Act
        Map<String, Object> result = homeService03.execute(employeeFrom);

        // Assert
        assertNotNull(result);
        assertTrue(result.containsKey("employeeName"));
        assertEquals("Test　User", result.get("employeeName"));
        assertTrue(result.containsKey("signInTime"));
        assertFalse(result.containsKey("password"));
        assertEquals(1, result.get("id"));
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
