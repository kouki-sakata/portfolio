package com.example.demo.service;

import com.example.teamdev.entity.Employee;
import com.example.teamdev.exception.DuplicateEmailException;
import com.example.teamdev.exception.EmployeeNotFoundException;
import com.example.teamdev.form.EmployeeManageForm;
import com.example.teamdev.form.ListForm; // Added for delete tests
import com.example.teamdev.mapper.EmployeeMapper;
import com.example.teamdev.service.EmployeeService; // Updated to EmployeeService
import com.example.teamdev.service.LogHistoryService01;
// ObjectMapper is part of EmployeeService's implementation detail (conversion to Map)
// We don't mock ObjectMapper itself but the result of the conversion for getAllEmployees.
// However, if EmployeeService directly exposed Employees, we wouldn't need to deal with Maps here.

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy; // Spy ObjectMapper if we want to verify its usage
import org.mockito.junit.jupiter.MockitoExtension;
import com.fasterxml.jackson.databind.ObjectMapper; // Needed for Spy and actual conversion logic


import java.util.ArrayList; // Added
import java.util.Arrays; // Added
import java.util.List; // Added
import java.util.Map; // Added
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList; // if needed for mappers
import static org.mockito.ArgumentMatchers.eq; // Added
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmployeeServiceTest { // Renamed class

    @Mock
    private EmployeeMapper employeeMapper;

    @Mock
    private LogHistoryService01 logHistoryService;

    // We need a real ObjectMapper instance in EmployeeService for map conversion.
    // EmployeeService initializes its own ObjectMapper.
    // So, we don't need to mock ObjectMapper here for EmployeeService's constructor.

    @InjectMocks
    private EmployeeService employeeService; // Updated to EmployeeService

    private EmployeeManageForm manageForm;
    private Employee existingEmployee;

    @BeforeEach
    void setUp() {
        manageForm = new EmployeeManageForm();
        manageForm.setFirstName("Test");
        manageForm.setLastName("User");
        manageForm.setEmail("test@example.com");
        manageForm.setPassword("password");
        manageForm.setAdminFlag("0");

        existingEmployee = new Employee();
        existingEmployee.setId(1);
        existingEmployee.setEmail("test@example.com");
        existingEmployee.setFirst_name("Existing");
        existingEmployee.setLast_name("Dude");
    }

    // --- createEmployee Tests (largely unchanged) ---
    @Test
    void createEmployee_shouldThrowDuplicateEmailException_whenEmailExists() {
        when(employeeMapper.findByEmail(manageForm.getEmail())).thenReturn(existingEmployee);
        DuplicateEmailException exception = assertThrows(DuplicateEmailException.class, () -> {
            employeeService.createEmployee(manageForm, 100);
        });
        assertEquals("メールアドレス「test@example.com」は既に使用されています。", exception.getMessage());
        verify(employeeMapper, never()).save(any(Employee.class));
    }

    @Test
    void createEmployee_shouldSaveEmployee_whenEmailDoesNotExist() throws DuplicateEmailException {
        when(employeeMapper.findByEmail(manageForm.getEmail())).thenReturn(null);
        Employee createdEmployee = employeeService.createEmployee(manageForm, 100);
        assertNotNull(createdEmployee);
        assertEquals(manageForm.getEmail(), createdEmployee.getEmail());
        verify(employeeMapper, times(1)).save(any(Employee.class));
        verify(logHistoryService, times(1)).execute(eq(3), eq(3), any(), any(), eq(100), any());
    }

    // --- updateEmployee Tests (largely unchanged) ---
    @Test
    void updateEmployee_shouldThrowEmployeeNotFoundException_whenEmployeeDoesNotExist() {
        Integer nonExistentEmployeeId = 999;
        manageForm.setEmployeeId(nonExistentEmployeeId.toString());
        when(employeeMapper.getById(nonExistentEmployeeId)).thenReturn(Optional.empty());
        EmployeeNotFoundException exception = assertThrows(EmployeeNotFoundException.class, () -> {
            employeeService.updateEmployee(nonExistentEmployeeId, manageForm, 100);
        });
        assertEquals("ID " + nonExistentEmployeeId + " の従業員は見つかりませんでした。", exception.getMessage());
    }

    @Test
    void updateEmployee_shouldThrowDuplicateEmailException_whenNewEmailExistsForAnotherEmployee() {
        Integer currentEmployeeId = 1;
        manageForm.setEmployeeId(currentEmployeeId.toString());
        manageForm.setEmail("newemail@example.com");
        Employee employeeToUpdate = new Employee();
        employeeToUpdate.setId(currentEmployeeId);
        employeeToUpdate.setEmail("original@example.com");
        Employee otherEmployeeWithNewEmail = new Employee();
        otherEmployeeWithNewEmail.setId(2);
        otherEmployeeWithNewEmail.setEmail("newemail@example.com");
        when(employeeMapper.getById(currentEmployeeId)).thenReturn(Optional.of(employeeToUpdate));
        when(employeeMapper.findByEmail("newemail@example.com")).thenReturn(otherEmployeeWithNewEmail);
        DuplicateEmailException exception = assertThrows(DuplicateEmailException.class, () -> {
            employeeService.updateEmployee(currentEmployeeId, manageForm, 100);
        });
        assertEquals("メールアドレス「newemail@example.com」は既に使用されています。", exception.getMessage());
        verify(employeeMapper, never()).upDate(any(Employee.class));
    }

    @Test
    void updateEmployee_shouldAllowUpdatingToSameEmail() throws DuplicateEmailException, EmployeeNotFoundException {
        Integer currentEmployeeId = 1;
        manageForm.setEmployeeId(currentEmployeeId.toString());
        manageForm.setEmail("original@example.com");
        Employee employeeToUpdate = new Employee();
        employeeToUpdate.setId(currentEmployeeId);
        employeeToUpdate.setEmail("original@example.com");
        when(employeeMapper.getById(currentEmployeeId)).thenReturn(Optional.of(employeeToUpdate));
        when(employeeMapper.findByEmail("original@example.com")).thenReturn(employeeToUpdate);
        employeeService.updateEmployee(currentEmployeeId, manageForm, 100);
        verify(employeeMapper, times(1)).upDate(any(Employee.class));
        verify(logHistoryService, times(1)).execute(eq(3), eq(3), any(), eq(currentEmployeeId), eq(100), any());
    }

    @Test
    void updateEmployee_shouldUpdateSuccessfully_whenDataIsValid() throws DuplicateEmailException, EmployeeNotFoundException {
        Integer currentEmployeeId = 1;
        manageForm.setEmployeeId(currentEmployeeId.toString());
        manageForm.setEmail("updated@example.com");
        Employee employeeToUpdate = new Employee();
        employeeToUpdate.setId(currentEmployeeId);
        employeeToUpdate.setEmail("original@example.com");
        when(employeeMapper.getById(currentEmployeeId)).thenReturn(Optional.of(employeeToUpdate));
        when(employeeMapper.findByEmail("updated@example.com")).thenReturn(null);
        Employee updatedEmployee = employeeService.updateEmployee(currentEmployeeId, manageForm, 100);
        assertNotNull(updatedEmployee);
        assertEquals("updated@example.com", updatedEmployee.getEmail());
        verify(employeeMapper, times(1)).upDate(any(Employee.class));
        verify(logHistoryService, times(1)).execute(eq(3), eq(3), any(), eq(currentEmployeeId), eq(100), any());
    }

    // --- Tests for getAllEmployees ---
    @Test
    void getAllEmployees_shouldReturnAllEmployees_whenAdminFlagIsNull() {
        // Arrange
        Employee emp1 = new Employee(); emp1.setId(1); emp1.setFirst_name("John"); emp1.setEmail("john@test.com");
        Employee emp2 = new Employee(); emp2.setId(2); emp2.setFirst_name("Jane"); emp2.setEmail("jane@test.com");
        List<Employee> employees = Arrays.asList(emp1, emp2);
        when(employeeMapper.getAllOrderById()).thenReturn(employees);

        // Act
        List<Map<String, Object>> result = employeeService.getAllEmployees(null);

        // Assert
        assertEquals(2, result.size());
        assertEquals("John", result.get(0).get("first_name")); // Using "first_name" as per entity
        assertEquals("jane@test.com", result.get(1).get("email"));
        verify(employeeMapper, times(1)).getAllOrderById();
        verify(employeeMapper, never()).getEmployeeByAdminFlagOrderById(anyInt());
    }

    @Test
    void getAllEmployees_shouldReturnFilteredEmployees_whenAdminFlagIsProvided() {
        // Arrange
        Integer adminFlag = 1;
        Employee empAdmin = new Employee(); empAdmin.setId(3); empAdmin.setFirst_name("Admin"); empAdmin.setAdmin_flag(1);
        List<Employee> adminEmployees = Arrays.asList(empAdmin);
        when(employeeMapper.getEmployeeByAdminFlagOrderById(adminFlag)).thenReturn(adminEmployees);

        // Act
        List<Map<String, Object>> result = employeeService.getAllEmployees(adminFlag);

        // Assert
        assertEquals(1, result.size());
        assertEquals("Admin", result.get(0).get("first_name"));
        assertEquals(1, result.get(0).get("admin_flag"));
        verify(employeeMapper, never()).getAllOrderById();
        verify(employeeMapper, times(1)).getEmployeeByAdminFlagOrderById(adminFlag);
    }

    @Test
    void getAllEmployees_shouldReturnEmptyList_whenNoEmployeesMatch() {
        // Arrange
        when(employeeMapper.getAllOrderById()).thenReturn(new ArrayList<>()); // For adminFlag = null
        when(employeeMapper.getEmployeeByAdminFlagOrderById(anyInt())).thenReturn(new ArrayList<>()); // For adminFlag provided

        // Act & Assert for adminFlag = null
        List<Map<String, Object>> resultNullFlag = employeeService.getAllEmployees(null);
        assertTrue(resultNullFlag.isEmpty());

        // Act & Assert for adminFlag provided
        List<Map<String, Object>> resultWithFlag = employeeService.getAllEmployees(0);
        assertTrue(resultWithFlag.isEmpty());
    }

    // --- Tests for deleteEmployees ---
    @Test
    void deleteEmployees_shouldCallDeleteByIdForEachEmployeeAndLogOnce() {
        // Arrange
        ListForm form = new ListForm();
        form.setIdList(Arrays.asList("1", "2", "3"));
        Integer updaterId = 100;

        // Act
        employeeService.deleteEmployees(form, updaterId);

        // Assert
        verify(employeeMapper, times(1)).deleteById(1);
        verify(employeeMapper, times(1)).deleteById(2);
        verify(employeeMapper, times(1)).deleteById(3);
        // Verify logHistoryService is called once after the loop with correct action type 4
        verify(logHistoryService, times(1)).execute(eq(3), eq(4), any(), any(), eq(updaterId), any());
    }

    @Test
    void deleteEmployees_shouldHandleEmptyIdList() {
        // Arrange
        ListForm form = new ListForm();
        form.setIdList(new ArrayList<>()); // Empty list
        Integer updaterId = 100;

        // Act
        employeeService.deleteEmployees(form, updaterId);

        // Assert
        verify(employeeMapper, never()).deleteById(anyInt());
        // Log should still be called, even if no deletions, to record the attempt/batch operation.
        // This depends on desired behavior; original code logged once after loop regardless.
        verify(logHistoryService, times(1)).execute(eq(3), eq(4), any(), any(), eq(updaterId), any());
    }
}
