package com.example.demo.service; // Assuming tests are in com.example.demo

import com.example.teamdev.entity.Employee;
import com.example.teamdev.exception.DuplicateEmailException;
import com.example.teamdev.exception.EmployeeNotFoundException;
import com.example.teamdev.form.EmployeeManageForm;
import com.example.teamdev.mapper.EmployeeMapper;
import com.example.teamdev.service.EmployeeManageService;
import com.example.teamdev.service.LogHistoryService01;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmployeeManageServiceTest {

    @Mock
    private EmployeeMapper employeeMapper;

    @Mock
    private LogHistoryService01 logHistoryService;

    @InjectMocks
    private EmployeeManageService employeeManageService;

    private EmployeeManageForm form;
    private Employee existingEmployee;

    @BeforeEach
    void setUp() {
        form = new EmployeeManageForm();
        form.setFirstName("Test");
        form.setLastName("User");
        form.setEmail("test@example.com");
        form.setPassword("password");
        form.setAdminFlag("0");

        existingEmployee = new Employee();
        existingEmployee.setId(1);
        existingEmployee.setEmail("test@example.com");
    }

    // --- createEmployee Tests ---

    @Test
    void createEmployee_shouldThrowDuplicateEmailException_whenEmailExists() {
        // Arrange
        when(employeeMapper.findByEmail(form.getEmail())).thenReturn(existingEmployee);

        // Act & Assert
        DuplicateEmailException exception = assertThrows(DuplicateEmailException.class, () -> {
            employeeManageService.createEmployee(form, 100); // Assuming 100 is an updater ID
        });
        assertEquals("メールアドレス「test@example.com」は既に使用されています。", exception.getMessage());
        verify(employeeMapper, never()).save(any(Employee.class));
    }

    @Test
    void createEmployee_shouldSaveEmployee_whenEmailDoesNotExist() throws DuplicateEmailException {
        // Arrange
        when(employeeMapper.findByEmail(form.getEmail())).thenReturn(null);
        // Mocking behavior for employeeMapper.save if it modifies the entity (e.g., sets ID)
        // For this test, we mainly care that it's called and no exception is thrown.
        // doNothing().when(employeeMapper).save(any(Employee.class)); // If save returns void

        // If save is part of a transaction that sets the ID on the entity,
        // and if the entity's ID is used by logHistoryService.execute,
        // more complex mocking might be needed for `save`, e.g., using an Answer.
        // For simplicity, assume `save` works and `logHistoryService` is called.

        // Act
        Employee createdEmployee = employeeManageService.createEmployee(form, 100);

        // Assert
        assertNotNull(createdEmployee);
        assertEquals(form.getEmail(), createdEmployee.getEmail());
        verify(employeeMapper, times(1)).save(any(Employee.class));
        verify(logHistoryService, times(1)).execute(anyInt(), anyInt(), any(), any(), anyInt(), any());
    }

    // --- updateEmployee Tests ---

    @Test
    void updateEmployee_shouldThrowEmployeeNotFoundException_whenEmployeeDoesNotExist() {
        // Arrange
        Integer nonExistentEmployeeId = 999;
        form.setEmployeeId(nonExistentEmployeeId.toString());
        when(employeeMapper.getById(nonExistentEmployeeId)).thenReturn(Optional.empty());

        // Act & Assert
        EmployeeNotFoundException exception = assertThrows(EmployeeNotFoundException.class, () -> {
            employeeManageService.updateEmployee(nonExistentEmployeeId, form, 100);
        });
        assertEquals("ID " + nonExistentEmployeeId + " の従業員は見つかりませんでした。", exception.getMessage());
    }

    @Test
    void updateEmployee_shouldThrowDuplicateEmailException_whenNewEmailExistsForAnotherEmployee() {
        // Arrange
        Integer currentEmployeeId = 1;
        form.setEmployeeId(currentEmployeeId.toString());
        form.setEmail("newemail@example.com"); // Trying to update to this email

        Employee employeeToUpdate = new Employee();
        employeeToUpdate.setId(currentEmployeeId);
        employeeToUpdate.setEmail("original@example.com");

        Employee otherEmployeeWithNewEmail = new Employee();
        otherEmployeeWithNewEmail.setId(2); // Different ID
        otherEmployeeWithNewEmail.setEmail("newemail@example.com");

        when(employeeMapper.getById(currentEmployeeId)).thenReturn(Optional.of(employeeToUpdate));
        when(employeeMapper.findByEmail("newemail@example.com")).thenReturn(otherEmployeeWithNewEmail);

        // Act & Assert
        DuplicateEmailException exception = assertThrows(DuplicateEmailException.class, () -> {
            employeeManageService.updateEmployee(currentEmployeeId, form, 100);
        });
        assertEquals("メールアドレス「newemail@example.com」は既に使用されています。", exception.getMessage());
        verify(employeeMapper, never()).upDate(any(Employee.class));
    }

    @Test
    void updateEmployee_shouldAllowUpdatingToSameEmail() throws DuplicateEmailException, EmployeeNotFoundException {
        // Arrange
        Integer currentEmployeeId = 1;
        form.setEmployeeId(currentEmployeeId.toString());
        form.setEmail("original@example.com"); // Email is not changing

        Employee employeeToUpdate = new Employee();
        employeeToUpdate.setId(currentEmployeeId);
        employeeToUpdate.setEmail("original@example.com");

        when(employeeMapper.getById(currentEmployeeId)).thenReturn(Optional.of(employeeToUpdate));
        // When checking for email duplication, the existing record for THIS employee is returned
        when(employeeMapper.findByEmail("original@example.com")).thenReturn(employeeToUpdate);

        // Act
        employeeManageService.updateEmployee(currentEmployeeId, form, 100);

        // Assert
        verify(employeeMapper, times(1)).upDate(any(Employee.class));
        verify(logHistoryService, times(1)).execute(anyInt(), anyInt(), any(), eq(currentEmployeeId), anyInt(), any());
    }


    @Test
    void updateEmployee_shouldUpdateSuccessfully_whenDataIsValid() throws DuplicateEmailException, EmployeeNotFoundException {
        // Arrange
        Integer currentEmployeeId = 1;
        form.setEmployeeId(currentEmployeeId.toString());
        form.setEmail("updated@example.com");

        Employee employeeToUpdate = new Employee();
        employeeToUpdate.setId(currentEmployeeId);
        employeeToUpdate.setEmail("original@example.com");

        when(employeeMapper.getById(currentEmployeeId)).thenReturn(Optional.of(employeeToUpdate));
        when(employeeMapper.findByEmail("updated@example.com")).thenReturn(null); // New email is unique

        // Act
        Employee updatedEmployee = employeeManageService.updateEmployee(currentEmployeeId, form, 100);

        // Assert
        assertNotNull(updatedEmployee);
        assertEquals("updated@example.com", updatedEmployee.getEmail());
        verify(employeeMapper, times(1)).upDate(any(Employee.class));
        verify(logHistoryService, times(1)).execute(anyInt(), anyInt(), any(), eq(currentEmployeeId), anyInt(), any());
    }
}
