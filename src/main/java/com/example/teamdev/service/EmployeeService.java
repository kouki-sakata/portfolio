package com.example.teamdev.service;

import com.example.teamdev.dto.DataTablesRequest;
import com.example.teamdev.dto.DataTablesResponse;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.exception.DuplicateEmailException;
import com.example.teamdev.exception.EmployeeNotFoundException;
import com.example.teamdev.form.EmployeeManageForm;
import com.example.teamdev.form.ListForm;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * 従業員情報に関するビジネスロジックを統合するファサードサービスクラス。
 * 従業員のCRUD操作（作成、読み取り、更新、削除）および一覧取得機能を提供します。
 *
 * このクラスは既存のAPIとの互換性を維持しながら、単一責任の原則に従い、
 * 実際の処理は専門化されたサービスにデリゲートします：
 * - EmployeeQueryService: 検索・取得処理
 * - EmployeeCommandService: 作成・更新・削除処理
 * - EmployeeDataTableService: DataTables専用処理
 * - EmployeeCacheService: キャッシュ管理
 *
 * SOLID原則の改善：
 * - 単一責任の原則（SRP）: 各サービスが単一の責務を持つ
 * - 開放閉鎖原則（OCP）: 新機能は新しいサービスの追加で対応可能
 * - 依存性逆転の原則（DIP）: 具象クラスではなくサービス抽象に依存
 */
@Service
public class EmployeeService {

    private final EmployeeQueryService queryService;
    private final EmployeeCommandService commandService;
    private final EmployeeDataTableService dataTableService;
    private final EmployeeCacheService cacheService;

    /**
     * 必要な依存関係を注入してEmployeeServiceを構築します。
     *
     * @param queryService     従業員検索サービス
     * @param commandService   従業員コマンドサービス
     * @param dataTableService DataTablesサービス
     * @param cacheService     キャッシュ管理サービス
     */
    @Autowired
    public EmployeeService(
            EmployeeQueryService queryService,
            EmployeeCommandService commandService,
            EmployeeDataTableService dataTableService,
            EmployeeCacheService cacheService) {
        this.queryService = queryService;
        this.commandService = commandService;
        this.dataTableService = dataTableService;
        this.cacheService = cacheService;
    }

    /**
     * DataTables用の従業員データを取得します。
     * 処理はEmployeeDataTableServiceにデリゲートします。
     *
     * @param request DataTablesからのリクエストパラメータ
     * @return DataTables形式のレスポンスデータ
     */
    public DataTablesResponse<Map<String, Object>> getEmployeesForDataTables(DataTablesRequest request) {
        return dataTableService.getEmployeesForDataTables(request);
    }

    /**
     * 新しい従業員情報を作成します。
     * 処理はEmployeeCommandServiceにデリゲートします。
     *
     * @param form             登録する従業員情報を含むフォームオブジェクト
     * @param updateEmployeeId この操作を行う従業員のID（操作履歴用）
     * @return 作成された従業員エンティティ
     * @throws DuplicateEmailException メールアドレスが重複している場合
     */
    public Employee createEmployee(EmployeeManageForm form, Integer updateEmployeeId)
            throws DuplicateEmailException {
        return commandService.createEmployee(form, updateEmployeeId);
    }

    /**
     * 既存の従業員情報を更新します。
     * 処理はEmployeeCommandServiceにデリゲートします。
     *
     * @param employeeId       更新対象の従業員ID
     * @param form             更新内容を含むフォームオブジェクト
     * @param updateEmployeeId この操作を行う従業員のID（操作履歴用）
     * @return 更新された従業員エンティティ
     * @throws DuplicateEmailException   メールアドレスが重複している場合
     * @throws EmployeeNotFoundException 更新対象の従業員が見つからない場合
     */
    public Employee updateEmployee(Integer employeeId, EmployeeManageForm form, Integer updateEmployeeId)
            throws DuplicateEmailException, EmployeeNotFoundException {
        return commandService.updateEmployee(employeeId, form, updateEmployeeId);
    }

    /**
     * 全従業員の情報、または管理者フラグによってフィルタリングされた従業員情報を取得します。
     * 処理はEmployeeQueryServiceにデリゲートします。
     *
     * @param adminFlag フィルタリングする管理者フラグ (0: 一般, 1: 管理者)。nullの場合は全従業員を取得。
     * @return {@link Employee} のリスト。従業員が存在しない場合は空のリスト。
     */
    public List<Employee> getAllEmployees(Integer adminFlag) {
        return queryService.getAllEmployees(adminFlag);
    }

    /**
     * 管理者フラグごとにグループ化された従業員情報を効率的に取得します。
     * 処理はEmployeeQueryServiceにデリゲートします。
     *
     * @return 管理者フラグをキーとした従業員リストのマップ
     */
    public Map<Integer, List<Employee>> getEmployeesGroupedByAdminFlag() {
        return queryService.getEmployeesGroupedByAdminFlag();
    }

    /**
     * 指定されたIDリストに基づいて複数の従業員情報を削除します。
     * 処理はEmployeeCommandServiceにデリゲートします。
     *
     * @param listForm         削除対象の従業員IDのリストを含むフォームオブジェクト
     * @param updateEmployeeId この操作を行う従業員のID（操作履歴用）
     */
    public void deleteEmployees(ListForm listForm, Integer updateEmployeeId) {
        commandService.deleteEmployees(listForm, updateEmployeeId);
        // 削除後に追加のキャッシュクリアが必要な場合
        cacheService.clearEmployeeCache();
    }

    /**
     * 従業員キャッシュをクリアします。
     * 処理はEmployeeCacheServiceにデリゲートします。
     */
    public void clearEmployeeCache() {
        cacheService.clearEmployeeCache();
    }
}