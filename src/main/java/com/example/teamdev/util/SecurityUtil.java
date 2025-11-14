package com.example.teamdev.util;

import com.example.teamdev.constant.AppConstants;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.mapper.EmployeeMapper;
import com.example.teamdev.security.TeamDevelopUserDetails;
import java.util.Optional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Spring Securityに関連するユーティリティクラス
 */
public class SecurityUtil {

    private static EmployeeMapper employeeMapper;

    public SecurityUtil(EmployeeMapper employeeMapper) {
        SecurityUtil.employeeMapper = employeeMapper;
    }

    /**
     * 現在ログインしている従業員のIDを取得します
     * @return 従業員ID、取得できない場合はnull
     */
    public static Integer getCurrentEmployeeId() {
        return resolveEmployee().map(Employee::getId).orElse(null);
    }

    /**
     * 現在ログインしている従業員の情報を取得します
     * @return 従業員エンティティ、取得できない場合はnull
     */
    public static Employee getCurrentEmployee() {
        return resolveEmployee().orElse(null);
    }

    /**
     * 現在ログインしているユーザーが管理者かどうかを判定します
     * @return 管理者の場合true、それ以外はfalse
     */
    public static boolean isCurrentUserAdmin() {
        return resolveEmployee()
            .map(employee -> employee.getAdminFlag() == AppConstants.Employee.ADMIN_FLAG_ADMIN)
            .orElse(false);
    }

    private static Optional<Employee> resolveEmployee() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof TeamDevelopUserDetails userDetails) {
            return Optional.ofNullable(userDetails.getEmployee());
        }

        if (principal instanceof UserDetails springUser) {
            return lookupEmployee(springUser.getUsername());
        }

        if (principal instanceof String username) {
            return lookupEmployee(username);
        }

        return Optional.empty();
    }

    private static Optional<Employee> lookupEmployee(String username) {
        if (username == null || username.isBlank() || employeeMapper == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(employeeMapper.getEmployeeByEmail(username));
    }
}
