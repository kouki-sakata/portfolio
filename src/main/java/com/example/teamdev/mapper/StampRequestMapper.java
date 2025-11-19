package com.example.teamdev.mapper;

import com.example.teamdev.entity.StampRequest;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

/**
 * 打刻修正リクエストテーブルへのアクセスを提供するMapper。
 *
 * <p>すべてのSQLマッピングは {@code StampRequestMapper.xml} で定義されています。</p>
 *
 * <h3>利用可能なインデックス</h3>
 * <ul>
 *   <li>{@code idx_stamp_request_employee_status} - (employee_id, status)</li>
 *   <li>{@code idx_stamp_request_status_created} - (status, created_at DESC)</li>
 *   <li>{@code idx_stamp_request_pending_unique} - PENDING状態の一意制約</li>
 *   <li>{@code idx_stamp_request_stamp_history} - (stamp_history_id)</li>
 * </ul>
 *
 * @see com.example.teamdev.entity.StampRequest
 */
@Mapper
public interface StampRequestMapper {

    /**
     * IDでリクエストを取得します。
     *
     * @param id リクエストID
     * @return 該当するリクエスト、存在しない場合は{@code Optional.empty()}
     */
    Optional<StampRequest> findById(@Param("id") Integer id);

    /**
     * すべてのリクエストを作成日時の降順で取得します。
     *
     * <p><strong>警告:</strong> 本番環境では使用しないでください。
     * 大量のデータが存在する場合、メモリ不足を引き起こす可能性があります。
     * 代わりに {@link #findByEmployeeId(Integer)} や {@link #findByStatusWithPagination(String, int, int)}
     * などの絞り込みメソッドを使用してください。</p>
     *
     * @return すべてのリクエストのリスト（作成日時降順）
     * @deprecated 本番環境での使用は推奨されません。特定のクエリメソッドを使用してください。
     */
    @Deprecated
    List<StampRequest> findAll();

    /**
     * 指定された従業員のすべてのリクエストを作成日時の降順で取得します。
     *
     * <p>インデックス {@code idx_stamp_request_employee_status} を活用します。</p>
     *
     * @param employeeId 従業員ID
     * @return 該当するリクエストのリスト（作成日時降順）
     */
    List<StampRequest> findByEmployeeId(@Param("employeeId") Integer employeeId);

    /**
     * 指定された従業員の指定されたステータスのリクエストを作成日時の降順で取得します。
     *
     * <p>インデックス {@code idx_stamp_request_employee_status} を活用します。</p>
     *
     * @param employeeId 従業員ID
     * @param status ステータス（例: "PENDING", "APPROVED"）
     * @return 該当するリクエストのリスト（作成日時降順）
     */
    List<StampRequest> findByEmployeeIdAndStatus(
            @Param("employeeId") Integer employeeId,
            @Param("status") String status
    );

    /**
     * 指定された従業員のリクエストをページネーション付きで取得します。
     *
     * <p>インデックス {@code idx_stamp_request_employee_status} を活用します。</p>
     *
     * @param employeeId 従業員ID
     * @param offset スキップする件数
     * @param limit 取得する最大件数
     * @return 該当するリクエストのリスト（作成日時降順）
     */
    List<StampRequest> findByEmployeeIdWithPagination(
            @Param("employeeId") Integer employeeId,
            @Param("offset") int offset,
            @Param("limit") int limit
    );

    /**
     * 指定された従業員の指定されたステータスのリクエストをページネーション付きで取得します。
     *
     * <p>インデックス {@code idx_stamp_request_employee_status} を活用します。</p>
     *
     * @param employeeId 従業員ID
     * @param status ステータス（例: "PENDING", "APPROVED"）
     * @param offset スキップする件数
     * @param limit 取得する最大件数
     * @return 該当するリクエストのリスト（作成日時降順）
     */
    List<StampRequest> findByEmployeeIdAndStatusWithPagination(
            @Param("employeeId") Integer employeeId,
            @Param("status") String status,
            @Param("offset") int offset,
            @Param("limit") int limit
    );

    /**
     * 指定された従業員のリクエスト件数をカウントします。
     *
     * @param employeeId 従業員ID
     * @return 該当するリクエストの件数
     */
    int countByEmployeeId(@Param("employeeId") Integer employeeId);

    /**
     * 指定された従業員の指定されたステータスのリクエスト件数をカウントします。
     *
     * @param employeeId 従業員ID
     * @param status ステータス（例: "PENDING", "APPROVED"）
     * @return 該当するリクエストの件数
     */
    int countByEmployeeIdAndStatus(
            @Param("employeeId") Integer employeeId,
            @Param("status") String status
    );

    /**
     * 指定された従業員と勤怠履歴IDに対するPENDING状態のリクエストを検索します。
     *
     * <p>重複申請チェックに使用されます。
     * Partial Index {@code idx_stamp_request_pending_unique_with_history} により、
     * PENDING状態のリクエストは同じ(employee_id, stamp_history_id)の組み合わせで
     * 最大1件しか存在できません。</p>
     *
     * @param employeeId 従業員ID
     * @param stampHistoryId 勤怠履歴ID
     * @return PENDING状態のリクエスト、存在しない場合は{@code Optional.empty()}
     */
    Optional<StampRequest> findPendingByEmployeeIdAndStampHistoryId(
            @Param("employeeId") Integer employeeId,
            @Param("stampHistoryId") Integer stampHistoryId
    );

    /**
     * 指定された従業員と日付に対するPENDING状態のリクエストを検索します（打刻レコードなし）。
     *
     * <p>打刻レコードが存在しない日の申請の重複チェックに使用されます。
     * Partial Index {@code idx_stamp_request_pending_unique_no_history} により、
     * stamp_history_id IS NULL かつ PENDING状態のリクエストは
     * 同じ(employee_id, stamp_date)の組み合わせで最大1件しか存在できません。</p>
     *
     * @param employeeId 従業員ID
     * @param stampDate 対象日付
     * @return PENDING状態のリクエスト、存在しない場合は{@code Optional.empty()}
     */
    Optional<StampRequest> findPendingByEmployeeIdAndStampDate(
            @Param("employeeId") Integer employeeId,
            @Param("stampDate") java.time.LocalDate stampDate
    );

    /**
     * 指定されたステータスのすべてのリクエストを作成日時の降順で取得します。
     *
     * <p>インデックス {@code idx_stamp_request_status_created} を活用します。</p>
     *
     * <p><strong>注意:</strong> 大量のデータが存在する場合は
     * {@link #findByStatusWithPagination(String, int, int)} の使用を推奨します。</p>
     *
     * @param status ステータス（例: "PENDING", "APPROVED"）
     * @return 該当するリクエストのリスト（作成日時降順）
     */
    List<StampRequest> findByStatus(@Param("status") String status);

    /**
     * 指定されたステータスのリクエストをページネーション付きで取得します。
     *
     * <p>インデックス {@code idx_stamp_request_status_created} を活用します。</p>
     *
     * @param status ステータス（例: "PENDING", "APPROVED"）
     * @param offset スキップする件数
     * @param limit 取得する最大件数
     * @return 該当するリクエストのリスト（作成日時降順）
     */
    List<StampRequest> findByStatusWithPagination(
            @Param("status") String status,
            @Param("offset") int offset,
            @Param("limit") int limit
    );

    /**
     * 指定されたステータスのリクエスト件数をカウントします。
     *
     * @param status ステータス（例: "PENDING", "APPROVED"）
     * @return 該当するリクエストの件数
     */
    int countByStatus(@Param("status") String status);

    /**
     * 指定された勤怠履歴IDに紐づく最新のリクエストを取得します。
     *
     * <p>勤怠履歴画面でのバッジ表示に使用されます。
     * インデックス {@code idx_stamp_request_stamp_history} を活用します。</p>
     *
     * @param stampHistoryId 勤怠履歴ID
     * @return 最新のリクエスト、存在しない場合は{@code Optional.empty()}
     */
    Optional<StampRequest> findLatestByStampHistoryId(@Param("stampHistoryId") Integer stampHistoryId);

    /**
     * 新しいリクエストを保存します。
     *
     * <p>IDは自動生成され、{@code request.id} に設定されます。
     * {@code created_at} と {@code updated_at} はデフォルト値が設定されますが、
     * 明示的に指定することも可能です。</p>
     *
     * @param request 保存するリクエスト（IDはnullまたは未設定）
     */
    void save(StampRequest request);

    /**
     * 既存のリクエストを更新します。
     *
     * <p><strong>注意:</strong> 以下のフィールドは不変のため更新されません:
     * <ul>
     *   <li>{@code employeeId} - 申請者は変更不可</li>
     *   <li>{@code stampHistoryId} - 対象勤怠履歴は変更不可</li>
     *   <li>{@code stampDate} - 対象日は変更不可</li>
     *   <li>{@code original*} - オリジナル値は不変スナップショット</li>
     *   <li>{@code requested*} - 申請内容は変更不可</li>
     *   <li>{@code reason} - 申請理由は変更不可</li>
     *   <li>{@code createdAt} - 作成日時は不変</li>
     * </ul>
     * </p>
     *
     * <p>更新可能なフィールド:
     * <ul>
     *   <li>{@code status} - ステータス遷移</li>
     *   <li>{@code approvalNote}, {@code approvalEmployeeId}, {@code approvedAt} - 承認時</li>
     *   <li>{@code rejectionReason}, {@code rejectionEmployeeId}, {@code rejectedAt} - 却下時</li>
     *   <li>{@code cancellationReason}, {@code cancelledAt} - 取消時</li>
     *   <li>{@code updatedAt} - 更新日時（トリガーで自動設定）</li>
     * </ul>
     * </p>
     *
     * @param request 更新するリクエスト（IDは必須）
     */
    void update(StampRequest request);

    /**
     * 検索条件に基づいてリクエストを検索します。
     *
     * <p>以下の条件でフィルタリングを行います:
     * <ul>
     *   <li>ステータス（完全一致）</li>
     *   <li>検索キーワード（理由、ID、従業員名のいずれかに部分一致、大文字小文字無視）</li>
     * </ul>
     * </p>
     *
     * @param status ステータス（nullの場合は全ステータス）
     * @param search 検索キーワード（nullの場合はフィルタなし）
     * @param sort ソート順（"recent", "oldest", "status"）
     * @param offset スキップする件数
     * @param limit 取得する最大件数
     * @return 該当するリクエストのリスト
     */
    List<StampRequest> findWithSearch(
            @Param("status") String status,
            @Param("search") String search,
            @Param("sort") String sort,
            @Param("offset") int offset,
            @Param("limit") int limit
    );

    /**
     * 検索条件に基づいてリクエスト件数をカウントします。
     *
     * @param status ステータス（nullの場合は全ステータス）
     * @param search 検索キーワード（nullの場合はフィルタなし）
     * @return 該当するリクエストの件数
     */
    int countWithSearch(
            @Param("status") String status,
            @Param("search") String search
    );

    /**
     * 指定されたIDのリクエストを削除します。
     *
     * @param id 削除するリクエストのID
     * @return 削除された件数（0または1）
     */
    int deleteById(@Param("id") Integer id);
}
