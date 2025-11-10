package com.example.teamdev.service;

import com.example.teamdev.entity.Employee;
import com.example.teamdev.mapper.EmployeeMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 従業員情報の検索・取得に関するビジネスロジックを担当するサービスクラス。
 * 読み取り専用の操作を提供し、単一責任の原則に従っています。
 */
@Service
public class EmployeeQueryService {

    private final EmployeeMapper employeeMapper;

    /**
     * EmployeeQueryServiceのコンストラクタ。
     *
     * @param employeeMapper 従業員マッパー
     */
    @Autowired
    public EmployeeQueryService(EmployeeMapper employeeMapper) {
        this.employeeMapper = employeeMapper;
    }

    /**
     * 指定されたIDの従業員情報を取得します。
     *
     * @param employeeId 従業員ID
     * @return 従業員エンティティのOptional
     */
    @Cacheable(value = "employeeById", key = "#employeeId")
    public Optional<Employee> getById(Integer employeeId) {
        return employeeMapper.getById(employeeId);
    }

    /**
     * メールアドレスで従業員を検索します。
     *
     * @param email メールアドレス
     * @return 従業員エンティティ。見つからない場合はnull
     */
    public Employee getByEmail(String email) {
        return employeeMapper.getEmployeeByEmail(email);
    }

    /**
     * 全従業員の情報、または管理者フラグによってフィルタリングされた従業員情報を取得します。
     * N+1クエリ問題を解決するため、一回のクエリで全従業員を取得しJavaでフィルタリングします。
     *
     * @param adminFlag フィルタリングする管理者フラグ (0: 一般, 1: 管理者)。nullの場合は全従業員を取得。
     * @return {@link Employee} のリスト。従業員が存在しない場合は空のリスト。
     */
    @Cacheable(value = "employees", key = "#adminFlag != null ? #adminFlag : 'all'")
    public List<Employee> getAllEmployees(Integer adminFlag) {
        if (adminFlag == null) {
            // 管理者フラグが指定されていない場合は全件取得
            return employeeMapper.getAllOrderById();
        } else {
            // N+1問題解決：全件取得後Javaでフィルタリング（キャッシュ効果も期待）
            return employeeMapper.getAllOrderById().stream()
                    .filter(employee -> employee.getAdminFlag().equals(adminFlag))
                    .toList();
        }
    }

    /**
     * 管理者フラグごとにグループ化された従業員情報を効率的に取得します。
     * N+1クエリ問題を解決するため、一回のクエリで全従業員を取得します。
     *
     * @return 管理者フラグをキーとした従業員リストのマップ
     */
    @Cacheable(value = "employeesGrouped")
    public Map<Integer, List<Employee>> getEmployeesGroupedByAdminFlag() {
        return employeeMapper.getAllEmployeesGroupedByAdminFlag().stream()
                .collect(Collectors.groupingBy(Employee::getAdmin_flag));
    }

    /**
     * 従業員の総数を取得します。
     *
     * @return 従業員の総数
     */
    public long countTotalEmployees() {
        return employeeMapper.countTotalEmployees();
    }

    /**
     * 検索条件に一致する従業員数を取得します。
     *
     * @param searchValue 検索値
     * @return 条件に一致する従業員数
     */
    public long countFilteredEmployees(String searchValue) {
        return employeeMapper.countFilteredEmployees(searchValue);
    }
}