package com.example.teamdev.service;

import com.example.teamdev.entity.Employee;
import com.example.teamdev.exception.DuplicateEmailException;
import com.example.teamdev.exception.EmployeeNotFoundException;
import com.example.teamdev.form.EmployeeManageForm;
import com.example.teamdev.form.ListForm;
import com.example.teamdev.mapper.EmployeeMapper;
import com.example.teamdev.mapper.LogHistoryMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.example.teamdev.dto.DataTablesRequest;
import com.example.teamdev.dto.DataTablesResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import java.util.Set;

/**
 * 従業員情報に関するビジネスロジックを担当するサービスクラス。
 * 従業員のCRUD操作（作成、読み取り、更新、削除）および一覧取得機能を提供します。
 */
@Service
public class EmployeeService {

    private final EmployeeMapper employeeMapper;
    private final LogHistoryRegistrationService logHistoryService;
    private final LogHistoryMapper logHistoryMapper;
    private final PasswordEncoder passwordEncoder;
    
    // SQLインジェクション対策: ホワイトリスト定義
    private static final Set<String> ALLOWED_COLUMNS = Set.of("id", "first_name", "last_name", "email", "admin_flag");
    private static final Set<String> ALLOWED_DIRECTIONS = Set.of("asc", "desc");

    /**
     * 必要な依存関係を注入してEmployeeServiceを構築します。
     *
     * @param employeeMapper    従業員マッパー
     * @param logHistoryService ログ履歴サービス
     * @param passwordEncoder   パスワードエンコーダー
     */
    @Autowired
    public EmployeeService(EmployeeMapper employeeMapper,
            LogHistoryRegistrationService logHistoryService,
            PasswordEncoder passwordEncoder,
            LogHistoryMapper logHistoryMapper) {
        this.employeeMapper = employeeMapper;
        this.logHistoryService = logHistoryService;
        this.passwordEncoder = passwordEncoder;
        this.logHistoryMapper = logHistoryMapper;
    }

    /**
     * DataTables用の従業員データを取得します。
     * パフォーマンス最適化: デフォルト値の処理とバリデーション改善
     */
    @Cacheable(value = "employeeDataTables", 
               key = "#request.search?.value + '_' + #request.start + '_' + #request.length + '_' + " +
                     "(#request.order != null && !#request.order.empty ? #request.order[0].column : 'id') + '_' + " +
                     "(#request.order != null && !#request.order.empty ? #request.order[0].dir : 'asc')")
    public DataTablesResponse getEmployeesForDataTables(DataTablesRequest request) {
        // パフォーマンス最適化: 検索値の早期初期化
        String searchValue = (request.getSearch() != null && request.getSearch().getValue() != null) 
                ? request.getSearch().getValue().trim() : "";
        
        // ソート情報の効率的な取得とセキュリティ検証
        String orderColumn = "id";
        String orderDir = "asc";
        
        if (request.getOrder() != null && !request.getOrder().isEmpty() && 
            request.getColumns() != null && !request.getColumns().isEmpty()) {
            int columnIndex = request.getOrder().get(0).getColumn();
            if (columnIndex >= 0 && columnIndex < request.getColumns().size()) {
                String column = request.getColumns().get(columnIndex).getData();
                if (column != null && !column.trim().isEmpty()) {
                    // SQLインジェクション対策: カラム名の検証
                    if (ALLOWED_COLUMNS.contains(column)) {
                        orderColumn = column;
                    }
                    // ソート方向の検証
                    String dir = request.getOrder().get(0).getDir();
                    if (dir != null && ALLOWED_DIRECTIONS.contains(dir.toLowerCase())) {
                        orderDir = dir.toLowerCase();
                    }
                }
            }
        }

        // length が 0 の場合は デフォルト値を設定
        int length = request.getLength() > 0 ? request.getLength() : 10;
        int start = request.getStart() >= 0 ? request.getStart() : 0;
        
        List<Employee> employees = employeeMapper.findFilteredEmployees(
                start,
                length,
                searchValue,
                orderColumn,
                orderDir
        );

        // カウントクエリの最適化: 空の検索値の場合は全件数を再利用
        long totalRecords = employeeMapper.countTotalEmployees();
        long filteredRecords = searchValue.isEmpty() ? totalRecords : employeeMapper.countFilteredEmployees(searchValue);

        // DataTables用にEmployeeエンティティをMapに変換
        List<Map<String, Object>> employeeDataList = new ArrayList<>();
        for (Employee emp : employees) {
            Map<String, Object> empData = new HashMap<>();
            empData.put("id", emp.getId());
            empData.put("first_name", emp.getFirst_name());
            empData.put("last_name", emp.getLast_name());
            empData.put("email", emp.getEmail());
            empData.put("password", emp.getPassword());
            empData.put("admin_flag", emp.getAdmin_flag());
            employeeDataList.add(empData);
        }

        DataTablesResponse<Map<String, Object>> response = new DataTablesResponse<>();
        response.setDraw(request.getDraw());
        response.setRecordsTotal(totalRecords);
        response.setRecordsFiltered(filteredRecords);
        response.setData(employeeDataList);

        return response;
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
    @CacheEvict(value = {"employees", "employeeDataTables"}, allEntries = true)
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
        entity.setPassword(passwordEncoder.encode(form.getPassword()));
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
    @CacheEvict(value = {"employees", "employeeDataTables", "employeeById"}, allEntries = true)
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
            entity.setPassword(passwordEncoder.encode(form.getPassword()));
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
                    .filter(employee -> employee.getAdmin_flag().equals(adminFlag))
                    .toList();
        }
    }

    /**
     * 管理者フラグごとにグループ化された従業員情報を効率的に取得します。
     * N+1クエリ問題を解決するため、一回のクエリで全従業員を取得します。
     *
     * @return 管理者フラグをキーとした従業員リストのマップ
     */
    public Map<Integer, List<Employee>> getEmployeesGroupedByAdminFlag() {
        return employeeMapper.getAllEmployeesGroupedByAdminFlag().stream()
                .collect(java.util.stream.Collectors.groupingBy(Employee::getAdmin_flag));
    }

    /**
     * 指定されたIDリストに基づいて複数の従業員情報を削除します。
     * N+1クエリ問題を解決するため、バッチ削除を使用します。
     *
     * @param listForm         削除対象の従業員IDのリストを含むフォームオブジェクト
     * @param updateEmployeeId この操作を行う従業員のID（操作履歴用）
     */
    @Transactional
    @CacheEvict(value = {"employees", "employeeDataTables", "employeeById"}, allEntries = true)
    public void deleteEmployees(ListForm listForm, Integer updateEmployeeId) {
        // N+1問題解決：バッチ削除を使用
        List<Integer> idList = listForm.getIdList().stream()
                .map(Integer::parseInt)
                .toList();
        
        if (!idList.isEmpty()) {
            // 先に履歴を削除してFK制約違反を回避
            logHistoryMapper.deleteByEmployeeIds(idList);
            employeeMapper.deleteByIdList(idList);
            logHistoryService.execute(3, 4, null, null, updateEmployeeId,
                    Timestamp.valueOf(LocalDateTime.now()));
            
            // キャッシュをクリアしてデータの整合性を保つ
            clearEmployeeCache();
        }
    }
    
    /**
     * 従業員キャッシュをクリアします。
     * データの更新・削除時に呼び出してデータの整合性を保ちます。
     */
    @CacheEvict(value = {"employees", "employeeDataTables", "employeeById"}, allEntries = true)
    public void clearEmployeeCache() {
        // Spring Cacheで自動的にキャッシュがクリアされるため、特別な処理は不要
    }
}
