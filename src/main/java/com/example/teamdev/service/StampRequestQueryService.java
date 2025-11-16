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

        // Use efficient query methods instead of findAll()
        List<StampRequest> requests = normalizedStatus != null
            ? store.findByEmployeeIdAndStatus(employeeId, normalizedStatus)
            : store.findByEmployeeId(employeeId);

        return requests.stream()
            .skip((long) safePage * safeSize)
            .limit(safeSize)
            .toList();
    }

    public Integer countEmployeeRequests(Integer employeeId, String status) {
        String normalizedStatus = normalizeStatus(status);

        // Use efficient query methods instead of findAll()
        List<StampRequest> requests = normalizedStatus != null
            ? store.findByEmployeeIdAndStatus(employeeId, normalizedStatus)
            : store.findByEmployeeId(employeeId);

        return requests.size();
    }

    /**
     * 保留中のリクエスト一覧を取得します。
     *
     * <p>検索条件がない場合はDB側でページングを行い、パフォーマンスを最適化します。
     * 検索条件がある場合のみ全件取得してJava側でフィルタリングします。</p>
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
        String queryStatus = normalizedStatus != null ? normalizedStatus : "PENDING";

        // 検索条件がない場合はDB側でページングを実行（パフォーマンス最適化）
        if (normalizedSearch == null && isDefaultSort(sort)) {
            int offset = safePage * safeSize;
            return store.findByStatusWithPagination(queryStatus, offset, safeSize);
        }

        // 検索条件またはカスタムソートがある場合は全件取得してJava側で処理
        Comparator<StampRequest> comparator = comparatorForSort(sort);
        Map<Integer, String> nameCache = new HashMap<>();
        List<StampRequest> requests = store.findByStatus(queryStatus);

        return requests.stream()
            .filter(request -> matchesSearch(request, normalizedSearch, nameCache))
            .sorted(comparator)
            .skip((long) safePage * safeSize)
            .limit(safeSize)
            .toList();
    }

    /**
     * 保留中のリクエスト件数をカウントします。
     *
     * <p>検索条件がない場合はDB側でカウントを行い、パフォーマンスを最適化します。
     * 検索条件がある場合のみ全件取得してJava側でフィルタリング後にカウントします。</p>
     *
     * @param status ステータスフィルタ（nullの場合はPENDINGをデフォルト使用）
     * @param search 検索キーワード（従業員名、理由、IDで検索）
     * @return マッチするリクエストの件数
     */
    public Integer countPendingRequests(String status, String search) {
        String normalizedStatus = normalizeStatus(status);
        String normalizedSearch = normalizeSearch(search);
        String queryStatus = normalizedStatus != null ? normalizedStatus : "PENDING";

        // 検索条件がない場合はDB側でカウント（パフォーマンス最適化）
        if (normalizedSearch == null) {
            return store.countByStatus(queryStatus);
        }

        // 検索条件がある場合は全件取得してJava側でフィルタリング後にカウント
        Map<Integer, String> nameCache = new HashMap<>();
        List<StampRequest> requests = store.findByStatus(queryStatus);

        return (int) requests.stream()
            .filter(request -> matchesSearch(request, normalizedSearch, nameCache))
            .count();
    }

    public Optional<StampRequest> getRequestDetail(Integer requestId) {
        return store.findById(requestId);
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            return null;
        }
        return status.toUpperCase(Locale.ROOT);
    }

    private String normalizeSearch(String search) {
        if (search == null) {
            return null;
        }
        String trimmed = search.trim();
        return trimmed.isEmpty() ? null : trimmed.toLowerCase(Locale.ROOT);
    }

    /**
     * ソート順がデフォルト（作成日時降順）かどうかを判定します。
     *
     * @param sort ソート指定文字列
     * @return デフォルトソートの場合true
     */
    private boolean isDefaultSort(String sort) {
        if (sort == null) {
            return true;
        }
        String normalized = sort.toLowerCase(Locale.ROOT);
        return "recent".equals(normalized) || normalized.isEmpty();
    }

    private Comparator<StampRequest> comparatorForSort(String sort) {
        String normalized = sort == null ? "recent" : sort.toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "oldest" -> Comparator.comparing(StampRequest::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()));
            case "status" -> Comparator.comparing(StampRequest::getStatus, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(StampRequest::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()));
            default -> Comparator.comparing(StampRequest::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()));
        };
    }

    private boolean shouldIncludeStatus(StampRequest request, String normalizedStatus) {
        if (normalizedStatus == null) {
            return true;
        }
        String requestStatus = request.getStatus();
        return normalizedStatus.equals(requestStatus);
    }

    /**
     * リクエストが検索条件にマッチするかを判定します。
     *
     * <p>検索対象: 申請理由、リクエストID、従業員名（すべて大文字小文字を区別しない）</p>
     *
     * @param request 判定対象のリクエスト
     * @param normalizedSearch 小文字化された検索キーワード（nullの場合は常にtrue）
     * @param nameCache 従業員名のキャッシュ（NPE防止のため、nullは格納しない）
     * @return マッチする場合true
     */
    private boolean matchesSearch(
        StampRequest request,
        String normalizedSearch,
        Map<Integer, String> nameCache
    ) {
        if (normalizedSearch == null) {
            return true;
        }
        if (request.getReason() != null && request.getReason().toLowerCase(Locale.ROOT).contains(normalizedSearch)) {
            return true;
        }
        if (request.getId() != null && request.getId().toString().contains(normalizedSearch)) {
            return true;
        }
        String name = resolveEmployeeName(request.getEmployeeId(), nameCache);
        // 従業員名を小文字化してから比較（大文字小文字を区別しない検索）
        return name != null && name.toLowerCase(Locale.ROOT).contains(normalizedSearch);
    }

    /**
     * 従業員IDから従業員名を解決します。
     *
     * <p>キャッシュを使用してDB呼び出しを最小化します。
     * nullは格納せず、存在しない従業員はnullを返します。</p>
     *
     * @param employeeId 従業員ID
     * @param nameCache 名前のキャッシュ（nullは格納しない）
     * @return 従業員名、存在しない場合はnull
     */
    private String resolveEmployeeName(Integer employeeId, Map<Integer, String> nameCache) {
        if (employeeId == null) {
            return null;
        }

        // キャッシュを先にチェック
        if (nameCache.containsKey(employeeId)) {
            return nameCache.get(employeeId);
        }

        // DBから取得（nullを返す可能性あり）
        String name = employeeMapper.getById(employeeId)
            .map(employee -> "%s %s".formatted(employee.getFirstName(), employee.getLastName()))
            .orElse(null);

        // nullでない場合のみキャッシュに格納（NPE防止）
        if (name != null) {
            nameCache.put(employeeId, name);
        }

        return name;
    }
}
