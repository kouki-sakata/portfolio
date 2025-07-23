package com.example.teamdev.util;

import com.example.teamdev.constant.AppConstants;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.mapper.EmployeeMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Spring Securityに関連するユーティリティクラス
 */
@Component
public class SecurityUtil {

    private static EmployeeMapper employeeMapper;

    @Autowired
    public SecurityUtil(EmployeeMapper employeeMapper) {
        SecurityUtil.employeeMapper = employeeMapper;
    }

    /**
     * 現在ログインしている従業員のIDを取得します
     * @return 従業員ID、取得できない場合はnull
     */
    public static Integer getCurrentEmployeeId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !authentication.getName().equals(AppConstants.Security.ANONYMOUS_USER)) {
            Employee currentEmployee = employeeMapper.getEmployeeByEmail(authentication.getName());
            return currentEmployee != null ? currentEmployee.getId() : null;
        }
        return null;
    }

    /**
     * 現在ログインしている従業員の情報を取得します
     * @return 従業員エンティティ、取得できない場合はnull
     */
    public static Employee getCurrentEmployee() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !authentication.getName().equals(AppConstants.Security.ANONYMOUS_USER)) {
            return employeeMapper.getEmployeeByEmail(authentication.getName());
        }
        return null;
    }

    /**
     * 現在ログインしているユーザーが管理者かどうかを判定します
     * @return 管理者の場合true、それ以外はfalse
     */
    public static boolean isCurrentUserAdmin() {
        Employee currentEmployee = getCurrentEmployee();
        return currentEmployee != null && currentEmployee.getAdmin_flag() == AppConstants.Employee.ADMIN_FLAG_ADMIN;
    }
}