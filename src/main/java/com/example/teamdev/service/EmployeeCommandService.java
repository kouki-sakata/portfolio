package com.example.teamdev.service;

import com.example.teamdev.entity.Employee;
import com.example.teamdev.exception.DuplicateEmailException;
import com.example.teamdev.exception.EmployeeNotFoundException;
import com.example.teamdev.form.EmployeeManageForm;
import com.example.teamdev.form.ListForm;
import com.example.teamdev.mapper.EmployeeMapper;
import com.example.teamdev.mapper.LogHistoryMapper;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Clock;
import java.util.List;

/**
 * 従業員情報の作成・更新・削除に関するビジネスロジックを担当するサービスクラス。
 * 書き込み操作に特化し、単一責任の原則に従っています。
 */
@Service
public class EmployeeCommandService {

    private final EmployeeMapper employeeMapper;
    private final LogHistoryMapper logHistoryMapper;
    private final LogHistoryRegistrationService logHistoryService;
    private final PasswordEncoder passwordEncoder;
    private final EmployeeQueryService employeeQueryService;
    private final Clock clock;

    /**
     * EmployeeCommandServiceのコンストラクタ。
     *
     * @param employeeMapper      従業員マッパー
     * @param logHistoryMapper    ログ履歴マッパー
     * @param logHistoryService   ログ履歴サービス
     * @param passwordEncoder     パスワードエンコーダー
     * @param employeeQueryService 従業員検索サービス
     */
    public EmployeeCommandService(
            EmployeeMapper employeeMapper,
            LogHistoryMapper logHistoryMapper,
            LogHistoryRegistrationService logHistoryService,
            PasswordEncoder passwordEncoder,
            EmployeeQueryService employeeQueryService,
            Clock clock) {
        this.employeeMapper = employeeMapper;
        this.logHistoryMapper = logHistoryMapper;
        this.logHistoryService = logHistoryService;
        this.passwordEncoder = passwordEncoder;
        this.employeeQueryService = employeeQueryService;
        this.clock = clock;
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
    @CacheEvict(value = {"employees", "employeeDataTables", "employeesGrouped"}, allEntries = true)
    public Employee createEmployee(EmployeeManageForm form, Integer updateEmployeeId)
            throws DuplicateEmailException {

        // メールアドレスの重複チェック
        if (employeeQueryService.getByEmail(form.getEmail()) != null) {
            throw new DuplicateEmailException(
                    "メールアドレス「" + form.getEmail() + "」は既に使用されています。");
        }

        Employee entity = new Employee();
        entity.setFirstName(form.getFirstName());
        entity.setLastName(form.getLastName());
        entity.setEmail(form.getEmail());
        entity.setPassword(passwordEncoder.encode(form.getPassword()));
        entity.setAdminFlag(Integer.parseInt(form.getAdminFlag()));

        Timestamp timestamp = Timestamp.from(clock.instant());
        entity.setUpdateDate(timestamp);

        employeeMapper.save(entity);
        logHistoryService.execute(3, 3, null, entity.getId(), updateEmployeeId, timestamp);

        return entity;
    }

    /**
     * 既存の従業員情報を更新します。
     * 指定された従業員IDが存在しない場合は {@link EmployeeNotFoundException} をスローします。
     * 更新しようとしているメールアドレスが他の従業員によって既に使用されている場合は
     * {@link DuplicateEmailException} をスローします。
     *
     * @param employeeId       更新対象の従業員ID
     * @param form             更新内容を含むフォームオブジェクト
     * @param updateEmployeeId この操作を行う従業員のID（操作履歴用）
     * @return 更新された従業員エンティティ
     * @throws DuplicateEmailException   メールアドレスが重複している場合
     * @throws EmployeeNotFoundException 更新対象の従業員が見つからない場合
     */
    @Transactional
    @CacheEvict(value = {"employees", "employeeDataTables", "employeeById", "employeesGrouped"},
                allEntries = true)
    public Employee updateEmployee(Integer employeeId, EmployeeManageForm form,
            Integer updateEmployeeId) throws DuplicateEmailException, EmployeeNotFoundException {

        Employee entity = employeeQueryService.getById(employeeId)
                .orElseThrow(() -> new EmployeeNotFoundException(
                        "ID " + employeeId + " の従業員は見つかりませんでした。"));

        // メールアドレスの重複チェック（自分以外）
        Employee existingByEmail = employeeQueryService.getByEmail(form.getEmail());
        if (existingByEmail != null && !existingByEmail.getId().equals(employeeId)) {
            throw new DuplicateEmailException(
                    "メールアドレス「" + form.getEmail() + "」は既に使用されています。");
        }

        entity.setFirstName(form.getFirstName());
        entity.setLastName(form.getLastName());
        entity.setEmail(form.getEmail());

        // パスワードは入力された場合のみ更新
        if (form.getPassword() != null && !form.getPassword().trim().isEmpty()) {
            entity.setPassword(passwordEncoder.encode(form.getPassword()));
        }

        entity.setAdminFlag(Integer.parseInt(form.getAdminFlag()));

        Timestamp timestamp = Timestamp.from(clock.instant());
        entity.setUpdateDate(timestamp);

        employeeMapper.upDate(entity);
        logHistoryService.execute(3, 3, null, entity.getId(), updateEmployeeId, timestamp);

        return entity;
    }

    /**
     * 指定されたIDリストに基づいて複数の従業員情報を削除します。
     * N+1クエリ問題を解決するため、バッチ削除を使用します。
     *
     * @param listForm         削除対象の従業員IDのリストを含むフォームオブジェクト
     * @param updateEmployeeId この操作を行う従業員のID（操作履歴用）
     */
    @Transactional
    @CacheEvict(value = {"employees", "employeeDataTables", "employeeById", "employeesGrouped"},
                allEntries = true)
    public void deleteEmployees(ListForm listForm, Integer updateEmployeeId) {
        // N+1問題解決：バッチ削除を使用
        List<Integer> idList = listForm.getIdList().stream()
                .map(Integer::parseInt)
                .toList();

        if (!idList.isEmpty()) {
            // 先に履歴を削除してFK制約違反を回避
            logHistoryMapper.deleteByEmployeeIds(idList);
            employeeMapper.deleteByIdList(idList);
            Timestamp timestamp = Timestamp.from(clock.instant());
            logHistoryService.execute(3, 4, null, null, updateEmployeeId, timestamp);
        }
    }
}
