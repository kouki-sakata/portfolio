package com.example.demo.service;

import com.example.teamdev.entity.Employee;
import com.example.teamdev.mapper.EmployeeMapper;
import com.example.teamdev.service.AuthenticationService;
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

    // Remove: @Mock private PasswordEncoder passwordEncoder;

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
        // Stored password is now plain text for the test
        storedEmployee.setPassword("plainPassword123");
        storedEmployee.setAdmin_flag(0);
    }

    @Test
    void execute_shouldReturnEmployeeMap_whenLoginIsSuccessful() {
        // Arrange
        when(employeeMapper.getEmployeeByEmail("test@example.com")).thenReturn(
                storedEmployee);
        // Remove: when(passwordEncoder.matches("plainPassword123", "hashedPasswordFromDB")).thenReturn(true);
        // Password comparison is now direct string equality within the service.

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
        storedEmployee.setPassword(
                "wrongPlainPassword"); // Set a different plain password
        when(employeeMapper.getEmployeeByEmail("test@example.com")).thenReturn(
                storedEmployee);
        // Remove: when(passwordEncoder.matches("plainPassword123", "hashedPasswordFromDB")).thenReturn(false);

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
        // If form password is null, and stored password is not null, .equals will be false.
        employeeFrom.setPassword(null);
        when(employeeMapper.getEmployeeByEmail("test@example.com")).thenReturn(
                storedEmployee);
        // No specific mock needed for passwordEncoder.matches as it's removed.
        // The service's Objects.nonNull(targetEmployee.getPassword()) and .equals(rawPassword) will handle this.
        // If rawPassword is null, targetEmployee.getPassword().equals(null) is false.

        // Act
        Map<String, Object> result = homeService03.execute(employeeFrom);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }
}
