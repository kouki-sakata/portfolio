package com.example.teamdev.service;

import com.example.teamdev.entity.Employee;
import com.example.teamdev.exception.DuplicateEmailException;
import com.example.teamdev.exception.EmployeeNotFoundException;
import com.example.teamdev.form.EmployeeManageForm;
import com.example.teamdev.form.ListForm;
import com.example.teamdev.mapper.EmployeeMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 従業員情報に関するビジネスロジックを担当するサービスクラス。
 * 従業員のCRUD操作（作成、読み取り、更新、削除）および一覧取得機能を提供します。
 */
@Service
public class EmployeeService {

    private final EmployeeMapper employeeMapper; // 従業員情報へのデータアクセスを行うマッパー
    private final LogHistoryRegistrationService logHistoryService; // 操作履歴の記録を行うサービス

    /**
     * 必要な依存関係を注入してEmployeeServiceを構築します。
     *
     * @param employeeMapper    従業員マッパー
     * @param logHistoryService ログ履歴サービス
     */
    @Autowired
    public EmployeeService(EmployeeMapper employeeMapper,
            LogHistoryRegistrationService logHistoryService) {
        this.employeeMapper = employeeMapper;
        this.logHistoryService = logHistoryService;
    }

    /**
     * 新しい従業員情報を作成します。
     * 指定されたメールアドレスが既に存在する場合は {@link DuplicateEmailException} をスローします。
     *
     * @param form             登録する従業員情報を含むフォームオブジェクト
     * @param updateEmployeeId この操作を行う従業員のID（操作履歴用）
     * @return 作成された従業員エンティティ
     * @throws DuplicateEmailException メールアドレスが重複している場合
     */
    @Transactional
    public Employee createEmployee(EmployeeManageForm form,
            Integer updateEmployeeId) throws DuplicateEmailException {
        if (employeeMapper.getEmployeeByEmail(form.getEmail()) != null) {
            throw new DuplicateEmailException(
                    "メールアドレス「" + form.getEmail() + "」は既に使用されています。");
        }

        Employee entity = new Employee();
        entity.setFirst_name(form.getFirstName());
        entity.setLast_name(form.getLastName());
        entity.setEmail(form.getEmail());
        entity.setPassword(form.getPassword());
        entity.setAdmin_flag(Integer.parseInt(form.getAdminFlag()));
        Timestamp timestamp = Timestamp.valueOf(LocalDateTime.now());
        entity.setUpdate_date(timestamp);
        employeeMapper.save(entity);
        logHistoryService.execute(3, 3, null, entity.getId(), updateEmployeeId,
                timestamp);
        return entity;
    }

    /**
     * 既存の従業員情報を更新します。
     * 指定された従業員IDが存在しない場合は {@link EmployeeNotFoundException} をスローします。
     * 更新しようとしているメールアドレスが他の従業員によって既に使用されている場合は {@link DuplicateEmailException} をスローします。
     *
     * @param employeeId       更新対象の従業員ID
     * @param form             更新内容を含むフォームオブジェクト
     * @param updateEmployeeId この操作を行う従業員のID（操作履歴用）
     * @return 更新された従業員エンティティ
     * @throws DuplicateEmailException   メールアドレスが重複している場合
     * @throws EmployeeNotFoundException 更新対象の従業員が見つからない場合
     */
    @Transactional
    public Employee updateEmployee(Integer employeeId, EmployeeManageForm form,
            Integer updateEmployeeId)
            throws DuplicateEmailException, EmployeeNotFoundException {
        Employee entity = employeeMapper.getById(employeeId)
                .orElseThrow(() -> new EmployeeNotFoundException(
                        "ID " + employeeId + " の従業員は見つかりませんでした。"));

        Employee existingByEmail = employeeMapper.getEmployeeByEmail(
                form.getEmail());
        if (existingByEmail != null && !existingByEmail.getId().equals(
                employeeId)) {
            throw new DuplicateEmailException(
                    "メールアドレス「" + form.getEmail() + "」は既に使用されています。");
        }
        entity.setFirst_name(form.getFirstName());
        entity.setLast_name(form.getLastName());
        entity.setEmail(form.getEmail());
        if (form.getPassword() != null && !form.getPassword().trim().isEmpty()) {
            entity.setPassword(form.getPassword());
        }
        entity.setAdmin_flag(Integer.parseInt(form.getAdminFlag()));
        Timestamp timestamp = Timestamp.valueOf(LocalDateTime.now());
        entity.setUpdate_date(timestamp);
        employeeMapper.upDate(entity);
        logHistoryService.execute(3, 3, null, entity.getId(), updateEmployeeId,
                timestamp);
        return entity;
    }

    /**
     * 全従業員の情報、または管理者フラグによってフィルタリングされた従業員情報を取得します。
     *
     * @param adminFlag フィルタリングする管理者フラグ (0: 一般, 1: 管理者)。nullの場合は全従業員を取得。
     * @return {@link Employee} のリスト。従業員が存在しない場合は空のリスト。
     */
    public List<Employee> getAllEmployees(Integer adminFlag) {
        // List<Map<String, Object>> employeeMapList = new ArrayList<>(); // 不要になる
        List<Employee> employeeList;
        if (adminFlag == null) {
            // 管理者フラグが指定されていない場合は全件取得
            employeeList = employeeMapper.getAllOrderById();
        } else {
            // 管理者フラグでフィルタリングして取得
            employeeList = employeeMapper.getEmployeeByAdminFlagOrderById(
                    adminFlag);
        }
        return employeeList;
    }

    /**
     * 指定されたIDリストに基づいて複数の従業員情報を削除します。
     *
     * @param listForm         削除対象の従業員IDのリストを含むフォームオブジェクト
     * @param updateEmployeeId この操作を行う従業員のID（操作履歴用）
     */
    @Transactional
    public void deleteEmployees(ListForm listForm, Integer updateEmployeeId) {
        for (String employeeIdStr : listForm.getIdList()) {
            int id = Integer.parseInt(employeeIdStr);
            employeeMapper.deleteById(id);
        }
        logHistoryService.execute(3, 4, null, null, updateEmployeeId,
                Timestamp.valueOf(LocalDateTime.now()));
    }
}
