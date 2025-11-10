package com.example.teamdev.service;

import com.example.teamdev.entity.Employee;
import com.example.teamdev.mapper.EmployeeMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private EmployeeMapper employeeMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private Clock clock;

    @InjectMocks
    private AuthenticationService authenticationService;

    private Employee formEmployee;
    private Employee dbEmployee;

    @BeforeEach
    void setUp() {
        formEmployee = new Employee();
        formEmployee.setEmail("test@example.com");
        formEmployee.setPassword("plainPassword");

        dbEmployee = new Employee();
        dbEmployee.setId(1);
        dbEmployee.setFirstName("太郎");
        dbEmployee.setLastName("田中");
        dbEmployee.setEmail("test@example.com");
        dbEmployee.setPassword("$2a$10$hashedPassword");
    }

    @Test
    void execute_shouldReturnEmployeeInfo_whenCredentialsAreValid() {
        when(clock.instant()).thenReturn(Instant.parse("2025-10-01T00:00:00Z"));
        when(clock.getZone()).thenReturn(ZoneId.of("Asia/Tokyo"));
        when(employeeMapper.getEmployeeByEmail(formEmployee.getEmail())).thenReturn(dbEmployee);
        when(passwordEncoder.matches(formEmployee.getPassword(), dbEmployee.getPassword())).thenReturn(true);
        when(objectMapper.convertValue(any(), eq(Map.class))).thenReturn(
            Map.of("id", 1, "firstName", "太郎", "lastName", "田中", "email", "test@example.com", "password", "hashedPassword")
        );

        Map<String, Object> result = authenticationService.execute(formEmployee);

        assertFalse(result.isEmpty());
        assertEquals(1, result.get("id"));
        assertEquals("太郎", result.get("first_name"));
        assertEquals("田中", result.get("last_name"));
        assertEquals("test@example.com", result.get("email"));
        assertEquals("太郎 田中", result.get("employeeName"));
        assertNotNull(result.get("signInTime"));
        assertTrue(result.get("signInTime") instanceof LocalDateTime);
        assertNull(result.get("password")); // パスワードが除去されていることを確認
        
        verify(employeeMapper, times(1)).getEmployeeByEmail(formEmployee.getEmail());
        verify(passwordEncoder, times(1)).matches(formEmployee.getPassword(), dbEmployee.getPassword());
    }

    @Test
    void execute_shouldReturnEmptyMap_whenPasswordDoesNotMatch() {
        when(employeeMapper.getEmployeeByEmail(formEmployee.getEmail())).thenReturn(dbEmployee);
        when(passwordEncoder.matches(formEmployee.getPassword(), dbEmployee.getPassword())).thenReturn(false);

        Map<String, Object> result = authenticationService.execute(formEmployee);

        assertTrue(result.isEmpty());
        
        verify(employeeMapper, times(1)).getEmployeeByEmail(formEmployee.getEmail());
        verify(passwordEncoder, times(1)).matches(formEmployee.getPassword(), dbEmployee.getPassword());
    }

    @Test
    void execute_shouldReturnEmptyMap_whenEmployeeNotFound() {
        when(employeeMapper.getEmployeeByEmail(formEmployee.getEmail())).thenReturn(null);

        Map<String, Object> result = authenticationService.execute(formEmployee);

        assertTrue(result.isEmpty());
        
        verify(employeeMapper, times(1)).getEmployeeByEmail(formEmployee.getEmail());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void execute_shouldHandleNullPassword() {
        formEmployee.setPassword(null);
        when(employeeMapper.getEmployeeByEmail(formEmployee.getEmail())).thenReturn(dbEmployee);

        Map<String, Object> result = authenticationService.execute(formEmployee);

        assertTrue(result.isEmpty());

        verify(employeeMapper, times(1)).getEmployeeByEmail(formEmployee.getEmail());
        verify(passwordEncoder, times(1)).matches(null, dbEmployee.getPassword());
    }

    @Test
    void execute_shouldHandleEmptyEmail() {
        formEmployee.setEmail("");
        when(employeeMapper.getEmployeeByEmail("")).thenReturn(null);

        Map<String, Object> result = authenticationService.execute(formEmployee);

        assertTrue(result.isEmpty());
        
        verify(employeeMapper, times(1)).getEmployeeByEmail("");
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }
}
