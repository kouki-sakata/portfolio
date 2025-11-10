package com.example.teamdev.service;

import com.example.teamdev.dto.DataTablesRequest;
import com.example.teamdev.dto.DataTablesResponse;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.mapper.EmployeeMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * DataTables用の従業員データ処理に特化したサービスクラス。
 * ページネーション、ソート、フィルタリング機能を提供します。
 * 単一責任の原則に従い、DataTables固有の処理のみを担当します。
 */
@Service
public class EmployeeDataTableService {

    private final EmployeeMapper employeeMapper;
    private final EmployeeQueryService employeeQueryService;

    // SQLインジェクション対策: ホワイトリスト定義
    private static final Set<String> ALLOWED_COLUMNS = Set.of(
            "id", "firstName", "lastName", "email", "adminFlag"
    );
    private static final Set<String> ALLOWED_DIRECTIONS = Set.of("asc", "desc");

    /**
     * EmployeeDataTableServiceのコンストラクタ。
     *
     * @param employeeMapper 従業員マッパー
     * @param employeeQueryService 従業員検索サービス
     */
    @Autowired
    public EmployeeDataTableService(EmployeeMapper employeeMapper,
            EmployeeQueryService employeeQueryService) {
        this.employeeMapper = employeeMapper;
        this.employeeQueryService = employeeQueryService;
    }

    /**
     * DataTables用の従業員データを取得します。
     * パフォーマンス最適化: デフォルト値の処理とバリデーション改善
     *
     * @param request DataTablesからのリクエストパラメータ
     * @return DataTables形式のレスポンスデータ
     */
    @Cacheable(value = "employeeDataTables",
               key = "#request.search?.value + '_' + #request.start + '_' + #request.length + '_' + " +
                     "(#request.order != null && !#request.order.empty ? #request.order[0].column : 'id') + '_' + " +
                     "(#request.order != null && !#request.order.empty ? #request.order[0].dir : 'asc')")
    public DataTablesResponse<Map<String, Object>> getEmployeesForDataTables(DataTablesRequest request) {

        // 検索値の取得と前処理
        String searchValue = extractSearchValue(request);

        // ソート情報の取得と検証
        SortInfo sortInfo = extractSortInfo(request);

        // ページング情報の取得と検証
        PageInfo pageInfo = extractPageInfo(request);

        // フィルタリングされた従業員データの取得
        List<Employee> employees = employeeMapper.findFilteredEmployees(
                pageInfo.start,
                pageInfo.length,
                searchValue,
                sortInfo.column,
                sortInfo.direction
        );

        // レコード数の取得（パフォーマンス最適化）
        long totalRecords = employeeQueryService.countTotalEmployees();
        long filteredRecords = searchValue.isEmpty()
                ? totalRecords
                : employeeQueryService.countFilteredEmployees(searchValue);

        // DataTables形式に変換
        List<Map<String, Object>> employeeDataList = convertToDataTableFormat(employees);

        return buildResponse(request.getDraw(), totalRecords, filteredRecords, employeeDataList);
    }

    /**
     * 検索値を抽出して前処理します。
     */
    private String extractSearchValue(DataTablesRequest request) {
        if (request.getSearch() != null && request.getSearch().getValue() != null) {
            return request.getSearch().getValue().trim();
        }
        return "";
    }

    /**
     * ソート情報を抽出して検証します。
     */
    private SortInfo extractSortInfo(DataTablesRequest request) {
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

        return new SortInfo(orderColumn, orderDir);
    }

    /**
     * ページング情報を抽出して検証します。
     */
    private PageInfo extractPageInfo(DataTablesRequest request) {
        int length = request.getLength() > 0 ? request.getLength() : 10;
        int start = request.getStart() >= 0 ? request.getStart() : 0;
        return new PageInfo(start, length);
    }

    /**
     * EmployeeエンティティをDataTables用のMap形式に変換します。
     */
    private List<Map<String, Object>> convertToDataTableFormat(List<Employee> employees) {
        List<Map<String, Object>> employeeDataList = new ArrayList<>();
        for (Employee emp : employees) {
            Map<String, Object> empData = new HashMap<>();
            empData.put("id", emp.getId());
            empData.put("firstName", emp.getFirstName());
            empData.put("lastName", emp.getLastName());
            empData.put("email", emp.getEmail());
            empData.put("password", emp.getPassword());
            empData.put("adminFlag", emp.getAdminFlag());
            employeeDataList.add(empData);
        }
        return employeeDataList;
    }

    /**
     * DataTablesレスポンスを構築します。
     */
    private DataTablesResponse<Map<String, Object>> buildResponse(
            int draw, long totalRecords, long filteredRecords,
            List<Map<String, Object>> data) {

        DataTablesResponse<Map<String, Object>> response = new DataTablesResponse<>();
        response.setDraw(draw);
        response.setRecordsTotal(totalRecords);
        response.setRecordsFiltered(filteredRecords);
        response.setData(data);
        return response;
    }

    /**
     * ソート情報を保持する内部クラス
     */
    private static record SortInfo(String column, String direction) {}

    /**
     * ページング情報を保持する内部クラス
     */
    private static record PageInfo(int start, int length) {}
}