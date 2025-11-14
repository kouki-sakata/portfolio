package com.example.teamdev.util;

import com.example.teamdev.constant.AppConstants;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.mapper.EmployeeMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * SecurityUtilのテストクラス
 */
@ExtendWith(MockitoExtension.class)
class SecurityUtilTest {

    @Mock
    private EmployeeMapper employeeMapper;

    @Mock
    private Authentication authentication;

    @Mock
    private SecurityContext securityContext;

    private SecurityUtil securityUtil;

    @BeforeEach
    void setUp() {
        securityUtil = new SecurityUtil(employeeMapper);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ========================================
    // getCurrentEmployeeId() - 正常系
    // ========================================

    @Test
    void getCurrentEmployeeId_認証済みユーザーのIDを返す() {
        // Given: 認証済みユーザー
        Employee employee = createEmployee(123, "test@example.com", false);

        setupAuthentication("test@example.com", true);
        when(employeeMapper.getEmployeeByEmail("test@example.com")).thenReturn(employee);

        // When
        Integer result = SecurityUtil.getCurrentEmployeeId();

        // Then
        assertEquals(123, result);
    }

    @Test
    void getCurrentEmployeeId_管理者ユーザーのIDを返す() {
        // Given: 管理者ユーザー
        Employee admin = createEmployee(999, "admin@example.com", true);

        setupAuthentication("admin@example.com", true);
        when(employeeMapper.getEmployeeByEmail("admin@example.com")).thenReturn(admin);

        // When
        Integer result = SecurityUtil.getCurrentEmployeeId();

        // Then
        assertEquals(999, result);
    }

    // ========================================
    // getCurrentEmployeeId() - 異常系
    // ========================================

    @Test
    void getCurrentEmployeeId_匿名ユーザーでnullを返す() {
        // Given: 匿名ユーザー
        setupAuthentication(AppConstants.Security.ANONYMOUS_USER, true);

        // When
        Integer result = SecurityUtil.getCurrentEmployeeId();

        // Then
        assertNull(result);
    }

    @Test
    void getCurrentEmployeeId_未認証でnullを返す() {
        // Given: 未認証
        setupAuthentication("test@example.com", false);

        // When
        Integer result = SecurityUtil.getCurrentEmployeeId();

        // Then
        assertNull(result);
    }

    @Test
    void getCurrentEmployeeId_Authenticationがnullでnullを返す() {
        // Given: Authenticationがnull
        when(securityContext.getAuthentication()).thenReturn(null);
        SecurityContextHolder.setContext(securityContext);

        // When
        Integer result = SecurityUtil.getCurrentEmployeeId();

        // Then
        assertNull(result);
    }

    @Test
    void getCurrentEmployeeId_従業員が存在しない場合nullを返す() {
        // Given: 従業員が見つからない
        setupAuthentication("notfound@example.com", true);
        when(employeeMapper.getEmployeeByEmail("notfound@example.com")).thenReturn(null);

        // When
        Integer result = SecurityUtil.getCurrentEmployeeId();

        // Then
        assertNull(result);
    }

    @Test
    void getCurrentEmployeeId_SecurityContextがnullの場合nullを返す() {
        // Given: SecurityContextがクリアされている
        SecurityContextHolder.clearContext();

        // When
        Integer result = SecurityUtil.getCurrentEmployeeId();

        // Then
        assertNull(result);
    }

    // ========================================
    // getCurrentEmployee() - 正常系
    // ========================================

    @Test
    void getCurrentEmployee_従業員エンティティを返す() {
        // Given
        Employee employee = createEmployee(123, "test@example.com", false);

        setupAuthentication("test@example.com", true);
        when(employeeMapper.getEmployeeByEmail("test@example.com")).thenReturn(employee);

        // When
        Employee result = SecurityUtil.getCurrentEmployee();

        // Then
        assertNotNull(result);
        assertEquals(123, result.getId());
        assertEquals("test@example.com", result.getEmail());
    }

    @Test
    void getCurrentEmployee_管理者エンティティを返す() {
        // Given
        Employee admin = createEmployee(999, "admin@example.com", true);

        setupAuthentication("admin@example.com", true);
        when(employeeMapper.getEmployeeByEmail("admin@example.com")).thenReturn(admin);

        // When
        Employee result = SecurityUtil.getCurrentEmployee();

        // Then
        assertNotNull(result);
        assertEquals(999, result.getId());
        assertEquals(AppConstants.Employee.ADMIN_FLAG_ADMIN, result.getAdminFlag());
    }

    // ========================================
    // getCurrentEmployee() - 異常系
    // ========================================

    @Test
    void getCurrentEmployee_匿名ユーザーでnullを返す() {
        // Given
        setupAuthentication(AppConstants.Security.ANONYMOUS_USER, true);

        // When
        Employee result = SecurityUtil.getCurrentEmployee();

        // Then
        assertNull(result);
    }

    @Test
    void getCurrentEmployee_未認証でnullを返す() {
        // Given
        setupAuthentication("test@example.com", false);

        // When
        Employee result = SecurityUtil.getCurrentEmployee();

        // Then
        assertNull(result);
    }

    @Test
    void getCurrentEmployee_従業員が存在しない場合nullを返す() {
        // Given
        setupAuthentication("notfound@example.com", true);
        when(employeeMapper.getEmployeeByEmail("notfound@example.com")).thenReturn(null);

        // When
        Employee result = SecurityUtil.getCurrentEmployee();

        // Then
        assertNull(result);
    }

    // ========================================
    // isCurrentUserAdmin() - 正常系
    // ========================================

    @Test
    void isCurrentUserAdmin_管理者の場合trueを返す() {
        // Given
        Employee admin = createEmployee(999, "admin@example.com", true);

        setupAuthentication("admin@example.com", true);
        when(employeeMapper.getEmployeeByEmail("admin@example.com")).thenReturn(admin);

        // When
        boolean result = SecurityUtil.isCurrentUserAdmin();

        // Then
        assertTrue(result);
    }

    @Test
    void isCurrentUserAdmin_一般ユーザーの場合falseを返す() {
        // Given
        Employee user = createEmployee(123, "user@example.com", false);

        setupAuthentication("user@example.com", true);
        when(employeeMapper.getEmployeeByEmail("user@example.com")).thenReturn(user);

        // When
        boolean result = SecurityUtil.isCurrentUserAdmin();

        // Then
        assertFalse(result);
    }

    // ========================================
    // isCurrentUserAdmin() - 異常系
    // ========================================

    @Test
    void isCurrentUserAdmin_匿名ユーザーの場合falseを返す() {
        // Given
        setupAuthentication(AppConstants.Security.ANONYMOUS_USER, true);

        // When
        boolean result = SecurityUtil.isCurrentUserAdmin();

        // Then
        assertFalse(result);
    }

    @Test
    void isCurrentUserAdmin_未認証の場合falseを返す() {
        // Given
        setupAuthentication("test@example.com", false);

        // When
        boolean result = SecurityUtil.isCurrentUserAdmin();

        // Then
        assertFalse(result);
    }

    @Test
    void isCurrentUserAdmin_従業員が存在しない場合falseを返す() {
        // Given
        setupAuthentication("notfound@example.com", true);
        when(employeeMapper.getEmployeeByEmail("notfound@example.com")).thenReturn(null);

        // When
        boolean result = SecurityUtil.isCurrentUserAdmin();

        // Then
        assertFalse(result);
    }

    @Test
    void isCurrentUserAdmin_SecurityContextがnullの場合falseを返す() {
        // Given
        SecurityContextHolder.clearContext();

        // When
        boolean result = SecurityUtil.isCurrentUserAdmin();

        // Then
        assertFalse(result);
    }

    // ========================================
    // 複合テストケース
    // ========================================

    @Test
    void 複数回呼び出しても一貫した結果を返す() {
        // Given
        Employee employee = createEmployee(123, "test@example.com", false);

        setupAuthentication("test@example.com", true);
        when(employeeMapper.getEmployeeByEmail("test@example.com")).thenReturn(employee);

        // When
        Integer id1 = SecurityUtil.getCurrentEmployeeId();
        Integer id2 = SecurityUtil.getCurrentEmployeeId();
        Employee emp1 = SecurityUtil.getCurrentEmployee();
        Employee emp2 = SecurityUtil.getCurrentEmployee();

        // Then
        assertEquals(id1, id2);
        assertEquals(emp1.getId(), emp2.getId());

        // SecurityUtilはキャッシュを持たないため、呼び出しごとにMapperが呼ばれる
        verify(employeeMapper, times(4)).getEmployeeByEmail("test@example.com");
    }

    @Test
    void 認証状態が変わると結果も変わる() {
        // Given: 最初は一般ユーザー
        Employee user = createEmployee(123, "user@example.com", false);
        setupAuthentication("user@example.com", true);
        when(employeeMapper.getEmployeeByEmail("user@example.com")).thenReturn(user);

        // When
        boolean isAdmin1 = SecurityUtil.isCurrentUserAdmin();

        // Then
        assertFalse(isAdmin1);

        // Given: 管理者に切り替え
        Employee admin = createEmployee(999, "admin@example.com", true);
        setupAuthentication("admin@example.com", true);
        when(employeeMapper.getEmployeeByEmail("admin@example.com")).thenReturn(admin);

        // When
        boolean isAdmin2 = SecurityUtil.isCurrentUserAdmin();

        // Then
        assertTrue(isAdmin2);
    }

    // ========================================
    // ヘルパーメソッド
    // ========================================

    private Employee createEmployee(Integer id, String email, boolean isAdmin) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setEmail(email);
        employee.setAdminFlag(
            isAdmin ? AppConstants.Employee.ADMIN_FLAG_ADMIN
                    : AppConstants.Employee.ADMIN_FLAG_GENERAL
        );
        return employee;
    }

    private void setupAuthentication(String username, boolean isAuthenticated) {
        when(authentication.getName()).thenReturn(username);
        when(authentication.isAuthenticated()).thenReturn(isAuthenticated);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }
}
