package com.example.teamdev.service;

import com.example.teamdev.mapper.EmployeeMapper;
import com.example.teamdev.entity.StampRequest;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class StampRequestQueryService {

    private final StampRequestStore store;
    private final EmployeeMapper employeeMapper;

    public StampRequestQueryService(StampRequestStore store, EmployeeMapper employeeMapper) {
        this.store = store;
        this.employeeMapper = employeeMapper;
    }

    public List<StampRequest> getEmployeeRequests(
        Integer employeeId,
        String status,
        Integer page,
        Integer size
    ) {
        String normalizedStatus = normalizeStatus(status);
        int safePage = Math.max(page != null ? page : 0, 0);
        int safeSize = size != null && size > 0 ? size : 20;
        int offset = safePage * safeSize;

        // DB側でページング（パフォーマンス最適化）
        return normalizedStatus != null
            ? store.findByEmployeeIdAndStatusWithPagination(employeeId, normalizedStatus, offset, safeSize)
            : store.findByEmployeeIdWithPagination(employeeId, offset, safeSize);
    }

    public Integer countEmployeeRequests(Integer employeeId, String status) {
        String normalizedStatus = normalizeStatus(status);

        // DB側でカウント（パフォーマンス最適化）
        return normalizedStatus != null
            ? store.countByEmployeeIdAndStatus(employeeId, normalizedStatus)
            : store.countByEmployeeId(employeeId);
    }

    /**
     * 保留中のリクエスト一覧を取得します。
     *
     * <p>検索・ソート・ページングはすべてデータベース側で実行されます。
     * これにより、大量のデータがある場合でもメモリ効率とパフォーマンスが維持されます。</p>
     *
     * @param page ページ番号（0始まり）
     * @param size ページサイズ
     * @param status ステータスフィルタ（nullの場合はPENDINGをデフォルト使用）
     * @param search 検索キーワード（従業員名、理由、IDで検索）
     * @param sort ソート順（"recent", "oldest", "status"）
     * @return フィルタリング・ソート済みのリクエスト一覧
     */
    public List<StampRequest> getPendingRequests(
        Integer page,
        Integer size,
        String status,
        String search,
        String sort
    ) {
        String normalizedStatus = normalizeStatus(status);
        String normalizedSearch = normalizeSearch(search);
        int safePage = Math.max(page != null ? page : 0, 0);
        int safeSize = size != null && size > 0 ? size : 20;
        int offset = safePage * safeSize;
        String queryStatus = normalizedStatus != null ? normalizedStatus : "PENDING";

        return store.findWithSearch(queryStatus, normalizedSearch, sort, offset, safeSize);
    }

    /**
     * 保留中のリクエスト件数をカウントします。
     *
     * <p>カウント処理はデータベース側で実行されます。</p>
     *
     * @param status ステータスフィルタ（nullの場合はPENDINGをデフォルト使用）
     * @param search 検索キーワード（従業員名、理由、IDで検索）
     * @return マッチするリクエストの件数
     */
    public Integer countPendingRequests(String status, String search) {
        String normalizedStatus = normalizeStatus(status);
        String normalizedSearch = normalizeSearch(search);
        String queryStatus = normalizedStatus != null ? normalizedStatus : "PENDING";

        return store.countWithSearch(queryStatus, normalizedSearch);
    }

    public Optional<StampRequest> getRequestDetail(Integer requestId) {
        return store.findById(requestId);
    }

    /**
     * ステータス文字列を正規化します。
     *
     * <p>以下の変換を行います:
     * <ul>
     *   <li>"ALL" → null（すべてのステータスを表示）</li>
     *   <li>"NEW" → "PENDING"（UIの「新規」タブ対応）</li>
     *   <li>その他 → 大文字に変換</li>
     * </ul>
     *
     * @param status ステータス文字列
     * @return 正規化されたステータス、またはnull（フィルタなし）
     */
    private String normalizeStatus(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            return null;
        }
        // UI の「新規」タブで "NEW" が渡されるが、DB には PENDING しかないため変換
        if ("NEW".equalsIgnoreCase(status)) {
            return "PENDING";
        }
        return status.toUpperCase(Locale.ROOT);
    }

    private String normalizeSearch(String search) {
        if (search == null) {
            return null;
        }
        String trimmed = search.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
