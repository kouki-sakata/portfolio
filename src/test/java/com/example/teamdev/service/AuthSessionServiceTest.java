package com.example.teamdev.service;

import com.example.teamdev.dto.api.common.EmployeeSummaryResponse;
import com.example.teamdev.entity.Employee;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationServiceException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthSessionServiceTest {

    @Mock
    private EmployeeQueryService employeeQueryService;

    @InjectMocks
    private AuthSessionService authSessionService;

    private Employee testEmployee;
    private Employee adminEmployee;

    @BeforeEach
    void setUp() {
        testEmployee = new Employee();
        testEmployee.setId(1);
        testEmployee.setEmail("test@example.com");
        testEmployee.setFirstName("太郎");
        testEmployee.setLastName("田中");
        testEmployee.setAdminFlag(0);

        adminEmployee = new Employee();
        adminEmployee.setId(2);
        adminEmployee.setEmail("admin@example.com");
        adminEmployee.setFirstName("花子");
        adminEmployee.setLastName("佐藤");
        adminEmployee.setAdminFlag(1);
    }

    // ========== getEmployeeSummaryByEmail tests ==========

    @Test
    void getEmployeeSummaryByEmail_shouldReturnEmployeeSummary_whenEmployeeExists() {
        when(employeeQueryService.getByEmail("test@example.com")).thenReturn(testEmployee);

        EmployeeSummaryResponse result = authSessionService.getEmployeeSummaryByEmail("test@example.com");

        assertNotNull(result);
        assertEquals(1, result.id());
        assertEquals("太郎", result.firstName());
        assertEquals("田中", result.lastName());
        assertEquals("test@example.com", result.email());
        assertFalse(result.admin());

        verify(employeeQueryService, times(1)).getByEmail("test@example.com");
    }

    @Test
    void getEmployeeSummaryByEmail_shouldThrowException_whenEmployeeNotFound() {
        when(employeeQueryService.getByEmail("notfound@example.com")).thenReturn(null);

        AuthenticationServiceException exception = assertThrows(
            AuthenticationServiceException.class,
            () -> authSessionService.getEmployeeSummaryByEmail("notfound@example.com")
        );

        assertEquals("Employee not found for email: notfound@example.com", exception.getMessage());
        verify(employeeQueryService, times(1)).getByEmail("notfound@example.com");
    }

    @Test
    void getEmployeeSummaryByEmail_shouldReturnAdminFlag_whenAdminEmployee() {
        when(employeeQueryService.getByEmail("admin@example.com")).thenReturn(adminEmployee);

        EmployeeSummaryResponse result = authSessionService.getEmployeeSummaryByEmail("admin@example.com");

        assertNotNull(result);
        assertEquals(2, result.id());
        assertTrue(result.admin());

        verify(employeeQueryService, times(1)).getByEmail("admin@example.com");
    }

    // ========== getEmployeeSummaryByEmailOrNull tests ==========

    @Test
    void getEmployeeSummaryByEmailOrNull_shouldReturnEmployeeSummary_whenEmployeeExists() {
        when(employeeQueryService.getByEmail("test@example.com")).thenReturn(testEmployee);

        EmployeeSummaryResponse result = authSessionService.getEmployeeSummaryByEmailOrNull("test@example.com");

        assertNotNull(result);
        assertEquals(1, result.id());
        assertEquals("太郎", result.firstName());
        assertEquals("田中", result.lastName());
        assertEquals("test@example.com", result.email());
        assertFalse(result.admin());

        verify(employeeQueryService, times(1)).getByEmail("test@example.com");
    }

    @Test
    void getEmployeeSummaryByEmailOrNull_shouldReturnNull_whenEmployeeNotFound() {
        when(employeeQueryService.getByEmail("notfound@example.com")).thenReturn(null);

        EmployeeSummaryResponse result = authSessionService.getEmployeeSummaryByEmailOrNull("notfound@example.com");

        assertNull(result);
        verify(employeeQueryService, times(1)).getByEmail("notfound@example.com");
    }

    @Test
    void getEmployeeSummaryByEmailOrNull_shouldReturnAdminFlag_whenAdminEmployee() {
        when(employeeQueryService.getByEmail("admin@example.com")).thenReturn(adminEmployee);

        EmployeeSummaryResponse result = authSessionService.getEmployeeSummaryByEmailOrNull("admin@example.com");

        assertNotNull(result);
        assertEquals(2, result.id());
        assertTrue(result.admin());

        verify(employeeQueryService, times(1)).getByEmail("admin@example.com");
    }

    // ========== existsByEmail tests ==========

    @Test
    void existsByEmail_shouldReturnTrue_whenEmployeeExists() {
        when(employeeQueryService.getByEmail("test@example.com")).thenReturn(testEmployee);

        boolean result = authSessionService.existsByEmail("test@example.com");

        assertTrue(result);
        verify(employeeQueryService, times(1)).getByEmail("test@example.com");
    }

    @Test
    void existsByEmail_shouldReturnFalse_whenEmployeeNotFound() {
        when(employeeQueryService.getByEmail("notfound@example.com")).thenReturn(null);

        boolean result = authSessionService.existsByEmail("notfound@example.com");

        assertFalse(result);
        verify(employeeQueryService, times(1)).getByEmail("notfound@example.com");
    }

    // ========== getEmployeeSummaryById tests ==========

    @Test
    void getEmployeeSummaryById_shouldReturnEmployeeSummary_whenEmployeeExists() {
        when(employeeQueryService.getById(1)).thenReturn(Optional.of(testEmployee));

        EmployeeSummaryResponse result = authSessionService.getEmployeeSummaryById(1);

        assertNotNull(result);
        assertEquals(1, result.id());
        assertEquals("太郎", result.firstName());
        assertEquals("田中", result.lastName());
        assertEquals("test@example.com", result.email());
        assertFalse(result.admin());

        verify(employeeQueryService, times(1)).getById(1);
    }

    @Test
    void getEmployeeSummaryById_shouldThrowException_whenEmployeeNotFound() {
        when(employeeQueryService.getById(999)).thenReturn(Optional.empty());

        AuthenticationServiceException exception = assertThrows(
            AuthenticationServiceException.class,
            () -> authSessionService.getEmployeeSummaryById(999)
        );

        assertEquals("Employee not found for ID: 999", exception.getMessage());
        verify(employeeQueryService, times(1)).getById(999);
    }

    @Test
    void getEmployeeSummaryById_shouldReturnAdminFlag_whenAdminEmployee() {
        when(employeeQueryService.getById(2)).thenReturn(Optional.of(adminEmployee));

        EmployeeSummaryResponse result = authSessionService.getEmployeeSummaryById(2);

        assertNotNull(result);
        assertEquals(2, result.id());
        assertTrue(result.admin());

        verify(employeeQueryService, times(1)).getById(2);
    }

    // ========== Admin flag boundary tests ==========

    @Test
    void shouldHandleNullAdminFlag() {
        Employee employeeWithNullAdminFlag = new Employee();
        employeeWithNullAdminFlag.setId(3);
        employeeWithNullAdminFlag.setEmail("null-admin@example.com");
        employeeWithNullAdminFlag.setFirstName("次郎");
        employeeWithNullAdminFlag.setLastName("鈴木");
        employeeWithNullAdminFlag.setAdminFlag(null);

        when(employeeQueryService.getByEmail("null-admin@example.com")).thenReturn(employeeWithNullAdminFlag);

        EmployeeSummaryResponse result = authSessionService.getEmployeeSummaryByEmail("null-admin@example.com");

        assertNotNull(result);
        assertFalse(result.admin());

        verify(employeeQueryService, times(1)).getByEmail("null-admin@example.com");
    }

    @Test
    void shouldHandleAdminFlagZero() {
        when(employeeQueryService.getByEmail("test@example.com")).thenReturn(testEmployee);

        EmployeeSummaryResponse result = authSessionService.getEmployeeSummaryByEmail("test@example.com");

        assertNotNull(result);
        assertFalse(result.admin());

        verify(employeeQueryService, times(1)).getByEmail("test@example.com");
    }

    @Test
    void shouldHandleAdminFlagOne() {
        when(employeeQueryService.getByEmail("admin@example.com")).thenReturn(adminEmployee);

        EmployeeSummaryResponse result = authSessionService.getEmployeeSummaryByEmail("admin@example.com");

        assertNotNull(result);
        assertTrue(result.admin());

        verify(employeeQueryService, times(1)).getByEmail("admin@example.com");
    }
}
