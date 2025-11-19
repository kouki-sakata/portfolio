package com.example.teamdev.service;

import com.example.teamdev.entity.StampRequest;
import com.example.teamdev.mapper.StampRequestMapper;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * StampRequest の永続化を抽象化するストア。
 *
 * <p>本番環境では {@link StampRequestMapper} (MyBatis) を使用し、
 * テスト環境（Mapper未注入時）ではインメモリストレージにフォールバックします。</p>
 *
 * <p>このパターンにより、サービス層のコードを変更することなく、
 * テスト環境と本番環境で異なる永続化戦略を使用できます。</p>
 */
@Service
public class StampRequestStore {

    private final StampRequestMapper mapper;
    private final Clock clock;

    // テスト用インメモリストレージ（mapperがnullの場合のみ使用）
    private final AtomicInteger idGenerator = new AtomicInteger(1000);
    private final Map<Integer, StampRequest> storage = new ConcurrentHashMap<>();

    public StampRequestStore(
        @Autowired(required = false) StampRequestMapper mapper,
        @Autowired(required = false) Clock clock
    ) {
        this.mapper = mapper;
        this.clock = clock != null ? clock : Clock.systemDefaultZone();
    }

    /**
     * リクエストを新規作成します。
     *
     * @param request 作成するリクエスト（IDはnull）
     * @return 作成されたリクエスト（IDが設定済み）
     * @throws IllegalArgumentException リクエストがnullの場合
     */
    public StampRequest create(StampRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("request must not be null");
        }

        OffsetDateTime now = now();
        request.setCreatedAt(now);
        request.setUpdatedAt(now);

        if (mapper != null) {
            // 本番: DB保存（IDは自動生成）
            mapper.save(request);
            return request;
        } else {
            // テスト: インメモリ
            int id = idGenerator.incrementAndGet();
            request.setId(id);
            storage.put(id, request);
            return request;
        }
    }

    /**
     * リクエストを保存します（新規作成 or 更新）。
     *
     * @param request 保存するリクエスト
     * @return 保存されたリクエスト
     * @throws IllegalArgumentException リクエストがnullの場合
     */
    public StampRequest save(StampRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("request must not be null");
        }

        if (request.getId() == null) {
            return create(request);
        }

        if (mapper != null) {
            // 本番: DB更新
            mapper.update(request);
            return request;
        } else {
            // テスト: インメモリ
            storage.put(request.getId(), request);
            return request;
        }
    }

    /**
     * IDでリクエストを取得します。
     *
     * @param id リクエストID
     * @return 該当するリクエスト、存在しない場合は{@code Optional.empty()}
     */
    public Optional<StampRequest> findById(Integer id) {
        if (id == null) {
            return Optional.empty();
        }

        if (mapper != null) {
            return mapper.findById(id);
        } else {
            return Optional.ofNullable(storage.get(id));
        }
    }

    /**
     * 従業員IDでリクエストを取得します。
     *
     * @param employeeId 従業員ID
     * @return 該当するリクエストのリスト（作成日時降順）
     */
    public List<StampRequest> findByEmployeeId(Integer employeeId) {
        if (mapper != null) {
            return mapper.findByEmployeeId(employeeId);
        } else {
            return storage.values().stream()
                .filter(r -> Objects.equals(r.getEmployeeId(), employeeId))
                .sorted(Comparator.comparing(StampRequest::getCreatedAt).reversed())
                .toList();
        }
    }

    /**
     * 従業員ID + ステータスでリクエストを取得します。
     *
     * @param employeeId 従業員ID
     * @param status ステータス
     * @return 該当するリクエストのリスト（作成日時降順）
     */
    public List<StampRequest> findByEmployeeIdAndStatus(Integer employeeId, String status) {
        if (mapper != null) {
            return mapper.findByEmployeeIdAndStatus(employeeId, status);
        } else {
            return storage.values().stream()
                .filter(r -> Objects.equals(r.getEmployeeId(), employeeId))
                .filter(r -> Objects.equals(r.getStatus(), status))
                .sorted(Comparator.comparing(StampRequest::getCreatedAt).reversed())
                .toList();
        }
    }

    /**
     * 従業員IDでリクエストをページネーション付きで取得します。
     *
     * @param employeeId 従業員ID
     * @param offset スキップする件数
     * @param limit 取得する最大件数
     * @return 該当するリクエストのリスト（作成日時降順）
     */
    public List<StampRequest> findByEmployeeIdWithPagination(Integer employeeId, int offset, int limit) {
        if (mapper != null) {
            return mapper.findByEmployeeIdWithPagination(employeeId, offset, limit);
        } else {
            return storage.values().stream()
                .filter(r -> Objects.equals(r.getEmployeeId(), employeeId))
                .sorted(Comparator.comparing(StampRequest::getCreatedAt).reversed())
                .skip(offset)
                .limit(limit)
                .toList();
        }
    }

    /**
     * 従業員ID + ステータスでリクエストをページネーション付きで取得します。
     *
     * @param employeeId 従業員ID
     * @param status ステータス
     * @param offset スキップする件数
     * @param limit 取得する最大件数
     * @return 該当するリクエストのリスト（作成日時降順）
     */
    public List<StampRequest> findByEmployeeIdAndStatusWithPagination(
        Integer employeeId,
        String status,
        int offset,
        int limit
    ) {
        if (mapper != null) {
            return mapper.findByEmployeeIdAndStatusWithPagination(employeeId, status, offset, limit);
        } else {
            return storage.values().stream()
                .filter(r -> Objects.equals(r.getEmployeeId(), employeeId))
                .filter(r -> Objects.equals(r.getStatus(), status))
                .sorted(Comparator.comparing(StampRequest::getCreatedAt).reversed())
                .skip(offset)
                .limit(limit)
                .toList();
        }
    }

    /**
     * 従業員IDでリクエスト件数をカウントします。
     *
     * @param employeeId 従業員ID
     * @return 該当するリクエストの件数
     */
    public int countByEmployeeId(Integer employeeId) {
        if (mapper != null) {
            return mapper.countByEmployeeId(employeeId);
        } else {
            return (int) storage.values().stream()
                .filter(r -> Objects.equals(r.getEmployeeId(), employeeId))
                .count();
        }
    }

    /**
     * 従業員ID + ステータスでリクエスト件数をカウントします。
     *
     * @param employeeId 従業員ID
     * @param status ステータス
     * @return 該当するリクエストの件数
     */
    public int countByEmployeeIdAndStatus(Integer employeeId, String status) {
        if (mapper != null) {
            return mapper.countByEmployeeIdAndStatus(employeeId, status);
        } else {
            return (int) storage.values().stream()
                .filter(r -> Objects.equals(r.getEmployeeId(), employeeId))
                .filter(r -> Objects.equals(r.getStatus(), status))
                .count();
        }
    }

    /**
     * PENDING状態のリクエストを検索します（重複チェック用）。
     *
     * @param employeeId 従業員ID
     * @param stampHistoryId 勤怠履歴ID
     * @return PENDING状態のリクエスト、存在しない場合は{@code Optional.empty()}
     */
    public Optional<StampRequest> findPendingByEmployeeIdAndStampHistoryId(
        Integer employeeId,
        Integer stampHistoryId
    ) {
        if (mapper != null) {
            return mapper.findPendingByEmployeeIdAndStampHistoryId(employeeId, stampHistoryId);
        } else {
            return storage.values().stream()
                .filter(r -> Objects.equals(r.getEmployeeId(), employeeId))
                .filter(r -> Objects.equals(r.getStampHistoryId(), stampHistoryId))
                .filter(r -> Objects.equals(r.getStatus(), "PENDING"))
                .findFirst();
        }
    }

    /**
     * PENDING状態のリクエストを検索します（打刻レコードなし申請用の重複チェック）。
     *
     * @param employeeId 従業員ID
     * @param stampDate 対象日付
     * @return PENDING状態のリクエスト、存在しない場合は{@code Optional.empty()}
     */
    public Optional<StampRequest> findPendingByEmployeeIdAndStampDate(
        Integer employeeId,
        java.time.LocalDate stampDate
    ) {
        if (mapper != null) {
            return mapper.findPendingByEmployeeIdAndStampDate(employeeId, stampDate);
        } else {
            return storage.values().stream()
                .filter(r -> Objects.equals(r.getEmployeeId(), employeeId))
                .filter(r -> Objects.equals(r.getStampDate(), stampDate))
                .filter(r -> Objects.equals(r.getStatus(), "PENDING"))
                .filter(r -> r.getStampHistoryId() == null)  // 打刻レコードなしのみ
                .findFirst();
        }
    }

    /**
     * ステータスでリクエストを取得します。
     *
     * @param status ステータス
     * @return 該当するリクエストのリスト（作成日時降順）
     */
    public List<StampRequest> findByStatus(String status) {
        if (mapper != null) {
            return mapper.findByStatus(status);
        } else {
            return storage.values().stream()
                .filter(r -> Objects.equals(r.getStatus(), status))
                .sorted(Comparator.comparing(StampRequest::getCreatedAt).reversed())
                .toList();
        }
    }

    /**
     * ステータスでリクエストをページネーション付きで取得します。
     *
     * @param status ステータス
     * @param offset スキップする件数
     * @param limit 取得する最大件数
     * @return 該当するリクエストのリスト（作成日時降順）
     */
    public List<StampRequest> findByStatusWithPagination(String status, int offset, int limit) {
        if (mapper != null) {
            return mapper.findByStatusWithPagination(status, offset, limit);
        } else {
            return storage.values().stream()
                .filter(r -> Objects.equals(r.getStatus(), status))
                .sorted(Comparator.comparing(StampRequest::getCreatedAt).reversed())
                .skip(offset)
                .limit(limit)
                .toList();
        }
    }

    /**
     * ステータスでリクエスト件数をカウントします。
     *
     * @param status ステータス
     * @return 該当するリクエストの件数
     */
    public int countByStatus(String status) {
        if (mapper != null) {
            return mapper.countByStatus(status);
        } else {
            return (int) storage.values().stream()
                .filter(r -> Objects.equals(r.getStatus(), status))
                .count();
        }
    }

    /**
     * 検索条件に基づいてリクエストを検索します。
     *
     * @param status ステータス（nullの場合は全ステータス）
     * @param search 検索キーワード（nullの場合はフィルタなし）
     * @param sort ソート順（"recent", "oldest", "status"）
     * @param offset スキップする件数
     * @param limit 取得する最大件数
     * @return 該当するリクエストのリスト
     */
    public List<StampRequest> findWithSearch(String status, String search, String sort, int offset, int limit) {
        if (mapper != null) {
            return mapper.findWithSearch(status, search, sort, offset, limit);
        } else {
            // テスト用簡易実装
            return storage.values().stream()
                .filter(r -> status == null || Objects.equals(r.getStatus(), status))
                .filter(r -> search == null || (r.getReason() != null && r.getReason().contains(search)))
                .sorted(Comparator.comparing(StampRequest::getCreatedAt).reversed()) // 簡易的に常に作成日降順
                .skip(offset)
                .limit(limit)
                .toList();
        }
    }

    /**
     * 検索条件に基づいてリクエスト件数をカウントします。
     *
     * @param status ステータス（nullの場合は全ステータス）
     * @param search 検索キーワード（nullの場合はフィルタなし）
     * @return 該当するリクエストの件数
     */
    public int countWithSearch(String status, String search) {
        if (mapper != null) {
            return mapper.countWithSearch(status, search);
        } else {
            // テスト用簡易実装
            return (int) storage.values().stream()
                .filter(r -> status == null || Objects.equals(r.getStatus(), status))
                .filter(r -> search == null || (r.getReason() != null && r.getReason().contains(search)))
                .count();
        }
    }

    /**
     * すべてのリクエストを取得します。
     *
     * <p><strong>警告:</strong> 本番環境では使用しないでください。
     * このメソッドはテスト環境でのみ動作します。</p>
     *
     * @return すべてのリクエストのリスト
     * @throws UnsupportedOperationException 本番環境（Mapper使用時）で呼ばれた場合
     * @deprecated テスト専用。本番環境では {@link #findByEmployeeId(Integer)} や
     *             {@link #findByStatus(String)} などを使用してください。
     */
    @Deprecated
    public List<StampRequest> findAll() {
        if (mapper != null) {
            throw new UnsupportedOperationException(
                "findAll() is not supported in production. Use specific query methods instead."
            );
        }
        return new ArrayList<>(storage.values());
    }

    /**
     * 現在時刻を取得します。
     *
     * @return 現在時刻（Clock基準）
     */
    public OffsetDateTime now() {
        return OffsetDateTime.now(clock);
    }
}
