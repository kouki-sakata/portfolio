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
                .filter(r -> r.getEmployeeId().equals(employeeId))
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
                .filter(r -> r.getEmployeeId().equals(employeeId))
                .filter(r -> r.getStatus().equals(status))
                .sorted(Comparator.comparing(StampRequest::getCreatedAt).reversed())
                .toList();
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
                .filter(r -> r.getEmployeeId().equals(employeeId))
                .filter(r -> r.getStampHistoryId().equals(stampHistoryId))
                .filter(r -> "PENDING".equals(r.getStatus()))
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
                .filter(r -> r.getStatus().equals(status))
                .sorted(Comparator.comparing(StampRequest::getCreatedAt).reversed())
                .toList();
        }
    }

    /**
     * ステータスでリクエストをページネーション付きで取得します。
     *
     * @param status ステータス
     * @param offset 開始オフセット
     * @param limit 取得件数
     * @return ステータスに一致するリクエスト
     */
    public List<StampRequest> findByStatusWithPagination(String status, int offset, int limit) {
        if (mapper != null) {
            return mapper.findByStatusWithPagination(status, offset, limit);
        } else {
            return storage.values().stream()
                .filter(r -> r.getStatus().equals(status))
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
     * @return 件数
     */
    public int countByStatus(String status) {
        if (mapper != null) {
            return mapper.countByStatus(status);
        } else {
            return (int) storage.values().stream()
                .filter(r -> r.getStatus().equals(status))
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
