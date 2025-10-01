package com.example.teamdev.service;

import com.example.teamdev.dto.DataTablesRequest;
import com.example.teamdev.dto.DataTablesResponse;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.exception.DuplicateEmailException;
import com.example.teamdev.exception.EmployeeNotFoundException;
import com.example.teamdev.form.EmployeeManageForm;
import com.example.teamdev.form.ListForm;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * EmployeeServiceのファサードパターン委譲テスト。
 *
 * このテストクラスは、EmployeeServiceが正しく専門サービスに処理を委譲することを検証します。
 * ビジネスロジックの詳細は各専門サービスのテストで検証されます。
 *
 * テスト対象の委譲先:
 * - EmployeeQueryService: 検索・取得処理
 * - EmployeeCommandService: 作成・更新・削除処理
 * - EmployeeDataTableService: DataTables専用処理
 * - EmployeeCacheService: キャッシュ管理
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("EmployeeService ファサードテスト")
class EmployeeServiceTest {

    @Mock
    private EmployeeQueryService queryService;

    @Mock
    private EmployeeCommandService commandService;

    @Mock
    private EmployeeDataTableService dataTableService;

    @Mock
    private EmployeeCacheService cacheService;

    @InjectMocks
    private EmployeeService employeeService;

    private Employee testEmployee;
    private EmployeeManageForm testForm;
    private ListForm testListForm;

    @BeforeEach
    void setUp() {
        testEmployee = new Employee();
        testEmployee.setId(1);
        testEmployee.setEmail("test@example.com");
        testEmployee.setFirst_name("Test");
        testEmployee.setLast_name("User");

        testForm = new EmployeeManageForm();
        testForm.setEmail("test@example.com");
        testForm.setFirstName("Test");
        testForm.setLastName("User");
        testForm.setPassword("password");
        testForm.setAdminFlag("0");

        testListForm = new ListForm();
        testListForm.setIdList(Arrays.asList("1", "2", "3"));
    }

    @Nested
    @DisplayName("Query操作の委譲テスト")
    class QueryDelegationTests {

        @Test
        @DisplayName("getAllEmployees: QueryServiceに正しく委譲される")
        void getAllEmployees_delegatesToQueryService() {
            // Arrange
            List<Employee> expectedEmployees = Arrays.asList(testEmployee);
            when(queryService.getAllEmployees(0)).thenReturn(expectedEmployees);

            // Act
            List<Employee> result = employeeService.getAllEmployees(0);

            // Assert
            assertNotNull(result);
            assertEquals(expectedEmployees, result);
            verify(queryService, times(1)).getAllEmployees(0);
            verifyNoMoreInteractions(queryService);
            verifyNoInteractions(commandService, dataTableService, cacheService);
        }

        @Test
        @DisplayName("getAllEmployees: adminFlagがnullでも正しく委譲される")
        void getAllEmployees_withNullAdminFlag_delegatesToQueryService() {
            // Arrange
            List<Employee> expectedEmployees = Arrays.asList(testEmployee);
            when(queryService.getAllEmployees(null)).thenReturn(expectedEmployees);

            // Act
            List<Employee> result = employeeService.getAllEmployees(null);

            // Assert
            assertNotNull(result);
            assertEquals(expectedEmployees, result);
            verify(queryService, times(1)).getAllEmployees(null);
            verifyNoMoreInteractions(queryService);
            verifyNoInteractions(commandService, dataTableService, cacheService);
        }

        @Test
        @DisplayName("getEmployeesGroupedByAdminFlag: QueryServiceに正しく委譲される")
        void getEmployeesGroupedByAdminFlag_delegatesToQueryService() {
            // Arrange
            Map<Integer, List<Employee>> expectedMap = new HashMap<>();
            expectedMap.put(0, Arrays.asList(testEmployee));
            when(queryService.getEmployeesGroupedByAdminFlag()).thenReturn(expectedMap);

            // Act
            Map<Integer, List<Employee>> result = employeeService.getEmployeesGroupedByAdminFlag();

            // Assert
            assertNotNull(result);
            assertEquals(expectedMap, result);
            verify(queryService, times(1)).getEmployeesGroupedByAdminFlag();
            verifyNoMoreInteractions(queryService);
            verifyNoInteractions(commandService, dataTableService, cacheService);
        }
    }

    @Nested
    @DisplayName("Command操作の委譲テスト")
    class CommandDelegationTests {

        @Test
        @DisplayName("createEmployee: CommandServiceに正しく委譲される")
        void createEmployee_delegatesToCommandService() throws DuplicateEmailException {
            // Arrange
            when(commandService.createEmployee(testForm, 100)).thenReturn(testEmployee);

            // Act
            Employee result = employeeService.createEmployee(testForm, 100);

            // Assert
            assertNotNull(result);
            assertEquals(testEmployee, result);
            verify(commandService, times(1)).createEmployee(testForm, 100);
            verifyNoMoreInteractions(commandService);
            verifyNoInteractions(queryService, dataTableService, cacheService);
        }

        @Test
        @DisplayName("createEmployee: 例外も正しく伝播される")
        void createEmployee_propagatesException() throws DuplicateEmailException {
            // Arrange
            when(commandService.createEmployee(testForm, 100))
                    .thenThrow(new DuplicateEmailException("Duplicate email"));

            // Act & Assert
            assertThrows(DuplicateEmailException.class, () ->
                employeeService.createEmployee(testForm, 100));
            verify(commandService, times(1)).createEmployee(testForm, 100);
            verifyNoMoreInteractions(commandService);
            verifyNoInteractions(queryService, dataTableService, cacheService);
        }

        @Test
        @DisplayName("updateEmployee: CommandServiceに正しく委譲される")
        void updateEmployee_delegatesToCommandService() throws DuplicateEmailException, EmployeeNotFoundException {
            // Arrange
            when(commandService.updateEmployee(1, testForm, 100)).thenReturn(testEmployee);

            // Act
            Employee result = employeeService.updateEmployee(1, testForm, 100);

            // Assert
            assertNotNull(result);
            assertEquals(testEmployee, result);
            verify(commandService, times(1)).updateEmployee(1, testForm, 100);
            verifyNoMoreInteractions(commandService);
            verifyNoInteractions(queryService, dataTableService, cacheService);
        }

        @Test
        @DisplayName("updateEmployee: 例外も正しく伝播される")
        void updateEmployee_propagatesException() throws DuplicateEmailException, EmployeeNotFoundException {
            // Arrange
            when(commandService.updateEmployee(1, testForm, 100))
                    .thenThrow(new EmployeeNotFoundException("Employee not found"));

            // Act & Assert
            assertThrows(EmployeeNotFoundException.class, () ->
                employeeService.updateEmployee(1, testForm, 100));
            verify(commandService, times(1)).updateEmployee(1, testForm, 100);
            verifyNoMoreInteractions(commandService);
            verifyNoInteractions(queryService, dataTableService, cacheService);
        }

        @Test
        @DisplayName("deleteEmployees: CommandServiceとCacheServiceに正しく委譲される")
        void deleteEmployees_delegatesToCommandServiceAndCacheService() {
            // Arrange
            doNothing().when(commandService).deleteEmployees(testListForm, 100);
            doNothing().when(cacheService).clearEmployeeCache();

            // Act
            employeeService.deleteEmployees(testListForm, 100);

            // Assert
            verify(commandService, times(1)).deleteEmployees(testListForm, 100);
            verify(cacheService, times(1)).clearEmployeeCache();
            verifyNoMoreInteractions(commandService, cacheService);
            verifyNoInteractions(queryService, dataTableService);
        }
    }

    @Nested
    @DisplayName("DataTable操作の委譲テスト")
    class DataTableDelegationTests {

        @Test
        @DisplayName("getEmployeesForDataTables: DataTableServiceに正しく委譲される")
        void getEmployeesForDataTables_delegatesToDataTableService() {
            // Arrange
            DataTablesRequest request = new DataTablesRequest();
            DataTablesResponse<Map<String, Object>> expectedResponse = new DataTablesResponse<>();
            when(dataTableService.getEmployeesForDataTables(request)).thenReturn(expectedResponse);

            // Act
            DataTablesResponse<Map<String, Object>> result =
                employeeService.getEmployeesForDataTables(request);

            // Assert
            assertNotNull(result);
            assertEquals(expectedResponse, result);
            verify(dataTableService, times(1)).getEmployeesForDataTables(request);
            verifyNoMoreInteractions(dataTableService);
            verifyNoInteractions(queryService, commandService, cacheService);
        }
    }

    @Nested
    @DisplayName("Cache操作の委譲テスト")
    class CacheDelegationTests {

        @Test
        @DisplayName("clearEmployeeCache: CacheServiceに正しく委譲される")
        void clearEmployeeCache_delegatesToCacheService() {
            // Arrange
            doNothing().when(cacheService).clearEmployeeCache();

            // Act
            employeeService.clearEmployeeCache();

            // Assert
            verify(cacheService, times(1)).clearEmployeeCache();
            verifyNoMoreInteractions(cacheService);
            verifyNoInteractions(queryService, commandService, dataTableService);
        }
    }
}
