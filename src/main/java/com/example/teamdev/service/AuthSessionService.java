package com.example.teamdev.service;

import com.example.teamdev.dto.api.common.EmployeeSummaryResponse;
import com.example.teamdev.entity.Employee;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.stereotype.Service;

/**
 * 認証セッション管理に関するビジネスロジックを提供するサービスクラス。
 * Controller層とデータアクセス層の間に位置し、適切な責務分離を実現します。
 * SOLID原則に従い、認証関連の操作のみを責務とします。
 */
@Service
public class AuthSessionService {

    private final EmployeeQueryService employeeQueryService;

    /**
     * AuthSessionServiceのコンストラクタ。
     *
     * @param employeeQueryService 従業員検索サービス
     */
    @Autowired
    public AuthSessionService(EmployeeQueryService employeeQueryService) {
        this.employeeQueryService = employeeQueryService;
    }

    /**
     * メールアドレスから従業員の概要情報を取得します。
     * ログインやセッション確認で使用されます。
     *
     * @param email メールアドレス
     * @return 従業員概要レスポンス
     * @throws AuthenticationServiceException 従業員が見つからない場合
     */
    public EmployeeSummaryResponse getEmployeeSummaryByEmail(String email) {
        Employee employee = employeeQueryService.getByEmail(email);

        if (employee == null) {
            throw new AuthenticationServiceException("Employee not found for email: " + email);
        }

        return toEmployeeSummary(employee);
    }

    /**
     * メールアドレスから従業員の概要情報を取得します（null許容版）。
     * セッション確認など、従業員が存在しない場合もエラーとしない場面で使用します。
     *
     * @param email メールアドレス
     * @return 従業員概要レスポンス、見つからない場合はnull
     */
    public EmployeeSummaryResponse getEmployeeSummaryByEmailOrNull(String email) {
        Employee employee = employeeQueryService.getByEmail(email);

        if (employee == null) {
            return null;
        }

        return toEmployeeSummary(employee);
    }

    /**
     * EmployeeエンティティをEmployeeSummaryResponseに変換します。
     *
     * @param employee 従業員エンティティ
     * @return 従業員概要レスポンス
     */
    private EmployeeSummaryResponse toEmployeeSummary(Employee employee) {
        boolean isAdmin = isAdminUser(employee);

        return new EmployeeSummaryResponse(
                employee.getId(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getEmail(),
                isAdmin
        );
    }

    /**
     * 従業員が管理者かどうかを判定します。
     *
     * @param employee 従業員エンティティ
     * @return 管理者の場合true
     */
    private boolean isAdminUser(Employee employee) {
        return employee.getAdminFlag() != null && employee.getAdminFlag() == 1;
    }

    /**
     * メールアドレスに対応する従業員が存在するか確認します。
     *
     * @param email メールアドレス
     * @return 存在する場合true
     */
    public boolean existsByEmail(String email) {
        return employeeQueryService.getByEmail(email) != null;
    }

    /**
     * 従業員IDから従業員の概要情報を取得します。
     * 将来的な拡張用のメソッドです。
     *
     * @param employeeId 従業員ID
     * @return 従業員概要レスポンス
     * @throws AuthenticationServiceException 従業員が見つからない場合
     */
    public EmployeeSummaryResponse getEmployeeSummaryById(Integer employeeId) {
        return employeeQueryService.getById(employeeId)
                .map(this::toEmployeeSummary)
                .orElseThrow(() -> new AuthenticationServiceException(
                        "Employee not found for ID: " + employeeId));
    }
}