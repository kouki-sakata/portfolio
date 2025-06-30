package com.example.demo.service;

import com.example.teamdev.entity.Employee;
import com.example.teamdev.exception.DuplicateEmailException;
import com.example.teamdev.exception.EmployeeNotFoundException;
import com.example.teamdev.form.EmployeeManageForm;
import com.example.teamdev.form.ListForm;
import com.example.teamdev.mapper.EmployeeMapper;
import com.example.teamdev.service.EmployeeService;
import com.example.teamdev.service.LogHistoryRegistrationService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
// ObjectMapper と Spy は EmployeeService から ObjectMapper が削除されたため不要
// import org.mockito.Spy;
// import com.fasterxml.jackson.databind.ObjectMapper;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
// Map のインポートは getAllEmployees のテストでは不要になる
// import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
// import static org.mockito.ArgumentMatchers.anyList; // 必要に応じて
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmployeeServiceTest {

    @Mock
    private EmployeeMapper employeeMapper;

    @Mock
    private LogHistoryRegistrationService logHistoryService;

    @InjectMocks
    private EmployeeService employeeService;

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
        existingEmployee.setFirst_name("Existing"); // Lombokのgetter/setterを想定
        existingEmployee.setLast_name("Dude");    // Lombokのgetter/setterを想定
    }

    // --- createEmployee Tests ---
    @Test
    void createEmployee_shouldThrowDuplicateEmailException_whenEmailExists() {
        // モック設定を getEmployeeByEmail に修正
        when(employeeMapper.getEmployeeByEmail(manageForm.getEmail())).thenReturn(existingEmployee);
        DuplicateEmailException exception = assertThrows(DuplicateEmailException.class, () -> {
            employeeService.createEmployee(manageForm, 100);
        });
        assertEquals("メールアドレス「test@example.com」は既に使用されています。", exception.getMessage());
        verify(employeeMapper, never()).save(any(Employee.class));
    }

    @Test
    void createEmployee_shouldSaveEmployee_whenEmailDoesNotExist() throws DuplicateEmailException {
        // モック設定を getEmployeeByEmail に修正
        when(employeeMapper.getEmployeeByEmail(manageForm.getEmail())).thenReturn(null);
        Employee createdEmployee = employeeService.createEmployee(manageForm, 100);
        assertNotNull(createdEmployee);
        assertEquals(manageForm.getEmail(), createdEmployee.getEmail());
        verify(employeeMapper, times(1)).save(any(Employee.class));
        verify(logHistoryService, times(1)).execute(eq(3), eq(3), any(), any(), eq(100), any());
    }

    // --- updateEmployee Tests ---
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
        // モック設定を getEmployeeByEmail に修正
        when(employeeMapper.getEmployeeByEmail("newemail@example.com")).thenReturn(otherEmployeeWithNewEmail);
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
        // モック設定を getEmployeeByEmail に修正
        when(employeeMapper.getEmployeeByEmail("original@example.com")).thenReturn(employeeToUpdate);
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
        // モック設定を getEmployeeByEmail に修正
        when(employeeMapper.getEmployeeByEmail("updated@example.com")).thenReturn(null);
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
        List<Employee> expectedEmployees = Arrays.asList(emp1, emp2);
        when(employeeMapper.getAllOrderById()).thenReturn(expectedEmployees);

        // Act
        List<Employee> actualEmployees = employeeService.getAllEmployees(null); // 戻り値の型を List<Employee> に変更

        // Assert
        assertEquals(2, actualEmployees.size());
        // Employeeオブジェクトのプロパティを直接検証
        assertSame(expectedEmployees, actualEmployees); // リスト自体が同じであることを確認 (より厳密には内容を確認)
        assertEquals("John", actualEmployees.get(0).getFirst_name());
        assertEquals("jane@test.com", actualEmployees.get(1).getEmail());
        verify(employeeMapper, times(1)).getAllOrderById();
        verify(employeeMapper, never()).getEmployeeByAdminFlagOrderById(anyInt());
    }

    @Test
    void getAllEmployees_shouldReturnFilteredEmployees_whenAdminFlagIsProvided() {
        // Arrange
        Integer adminFlag = 1;
        Employee empAdmin = new Employee(); empAdmin.setId(3); empAdmin.setFirst_name("Admin"); empAdmin.setAdmin_flag(1);
        List<Employee> expectedAdminEmployees = Arrays.asList(empAdmin);
        when(employeeMapper.getEmployeeByAdminFlagOrderById(adminFlag)).thenReturn(expectedAdminEmployees);

        // Act
        List<Employee> actualAdminEmployees = employeeService.getAllEmployees(adminFlag); // 戻り値の型を List<Employee> に変更

        // Assert
        assertEquals(1, actualAdminEmployees.size());
        assertSame(expectedAdminEmployees, actualAdminEmployees);
        assertEquals("Admin", actualAdminEmployees.get(0).getFirst_name());
        assertEquals(1, actualAdminEmployees.get(0).getAdmin_flag());
        verify(employeeMapper, never()).getAllOrderById();
        verify(employeeMapper, times(1)).getEmployeeByAdminFlagOrderById(adminFlag);
    }

    @Test
    void getAllEmployees_shouldReturnEmptyList_whenNoEmployeesMatch() {
        // Arrange
        when(employeeMapper.getAllOrderById()).thenReturn(new ArrayList<>());
        when(employeeMapper.getEmployeeByAdminFlagOrderById(anyInt())).thenReturn(new ArrayList<>());

        // Act & Assert for adminFlag = null
        List<Employee> resultNullFlag = employeeService.getAllEmployees(null); // 戻り値の型を List<Employee> に変更
        assertTrue(resultNullFlag.isEmpty());

        // Act & Assert for adminFlag provided
        List<Employee> resultWithFlag = employeeService.getAllEmployees(0); // 戻り値の型を List<Employee> に変更
        assertTrue(resultWithFlag.isEmpty());
    }

    // --- Tests for deleteEmployees (unchanged from previous version as method signature didn't change) ---
    @Test
    void deleteEmployees_shouldCallDeleteByIdForEachEmployeeAndLogOnce() {
        ListForm form = new ListForm();
        form.setIdList(Arrays.asList("1", "2", "3"));
        Integer updaterId = 100;
        employeeService.deleteEmployees(form, updaterId);
        verify(employeeMapper, times(1)).deleteById(1);
        verify(employeeMapper, times(1)).deleteById(2);
        verify(employeeMapper, times(1)).deleteById(3);
        verify(logHistoryService, times(1)).execute(eq(3), eq(4), any(), any(), eq(updaterId), any());
    }

    @Test
    void deleteEmployees_shouldHandleEmptyIdList() {
        ListForm form = new ListForm();
        form.setIdList(new ArrayList<>());
        Integer updaterId = 100;
        employeeService.deleteEmployees(form, updaterId);
        verify(employeeMapper, never()).deleteById(anyInt());
        verify(logHistoryService, times(1)).execute(eq(3), eq(4), any(), any(), eq(updaterId), any());
    }
}
