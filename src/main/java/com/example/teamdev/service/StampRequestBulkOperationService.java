package com.example.teamdev.service;

import com.example.teamdev.constant.StampRequestStatus;
import com.example.teamdev.dto.api.stamprequest.StampRequestBulkOperationResponse;
import com.example.teamdev.entity.StampRequest;
import com.example.teamdev.exception.StampRequestException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.function.BiConsumer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * 打刻修正リクエストの一括操作を扱うサービス。
 *
 * Requirement 4 の受入基準を実装:
 * - バルク承認/却下（≤50件）
 * - 部分的成功の報告
 * - 共通却下理由（10-500文字）
 */
@Service
public class StampRequestBulkOperationService {

    private static final Logger log = LoggerFactory.getLogger(StampRequestBulkOperationService.class);
    private static final int MAX_BULK_SIZE = 50;

    private final StampRequestStore store;
    private final StampRequestApprovalService approvalService;

    public StampRequestBulkOperationService(
        StampRequestStore store,
        StampRequestApprovalService approvalService
    ) {
        this.store = store;
        this.approvalService = approvalService;
    }

    /**
     * 複数の申請を一括承認する。
     *
     * <p>個別承認（{@link StampRequestApprovalService#approveRequest}）と同等の処理を実行:
     * <ul>
     *   <li>StampHistory のスナップショット整合性チェック</li>
     *   <li>StampHistory への修正内容の反映</li>
     *   <li>StampRequest のステータス更新</li>
     * </ul>
     *
     * <p>部分的成功を許容し、個々のエラーは失敗件数としてカウント。
     *
     * @param requestIds 承認対象のリクエストID一覧（最大50件）
     * @param approverId 承認者の従業員ID
     * @param approvalNote 承認ノート（オプショナル、最大500文字）
     * @return 成功件数・失敗件数・失敗IDを含む結果
     */
    public StampRequestBulkOperationResponse bulkApprove(
        List<Integer> requestIds,
        Integer approverId,
        String approvalNote
    ) {
        if (approverId == null) {
            throw new IllegalArgumentException("承認者が指定されていません");
        }

        // 承認ノートの検証（オプショナルだが指定された場合は長さチェック）
        if (approvalNote != null && approvalNote.length() > 500) {
            throw new IllegalArgumentException("承認ノートは500文字以内で入力してください");
        }

        if (requestIds == null || requestIds.isEmpty()) {
            throw new IllegalArgumentException("処理対象の申請が選択されていません");
        }

        // バッチサイズ制限（Requirement 4-3）
        if (requestIds.size() > MAX_BULK_SIZE) {
            throw new IllegalArgumentException("一度に処理できる申請は50件までです");
        }

        List<Integer> failedIds = new ArrayList<>();
        int successCount = 0;

        for (Integer requestId : requestIds) {
            if (requestId == null) {
                continue;
            }
            try {
                // 個別承認と同じロジックを実行（StampHistory の更新を含む）
                approvalService.approveRequest(requestId, approverId, approvalNote);
                successCount++;
            } catch (StampRequestException | IllegalArgumentException e) {
                // 部分的成功を許容：個々のエラーは失敗としてカウント
                log.warn("一括承認でリクエスト {} の承認に失敗: {}", requestId, e.getMessage());
                failedIds.add(requestId);
            }
        }

        return new StampRequestBulkOperationResponse(successCount, failedIds.size(), failedIds);
    }

    public StampRequestBulkOperationResponse bulkReject(
        List<Integer> requestIds,
        Integer rejecterId,
        String rejectionReason
    ) {
        if (rejecterId == null) {
            throw new IllegalArgumentException("却下者が指定されていません");
        }

        // 却下理由の検証（Requirement 4-4）
        validateRejectionReason(rejectionReason);

        return processBulk(requestIds, (request, now) -> {
            request.setStatus(StampRequestStatus.REJECTED.name());
            request.setRejectionReason(rejectionReason);
            request.setRejectionEmployeeId(rejecterId);
            request.setRejectedAt(now);
        });
    }

    private void validateRejectionReason(String reason) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("却下理由は必須です");
        }
        if (reason.length() < 10) {
            throw new IllegalArgumentException("却下理由は10文字以上で入力してください");
        }
        if (reason.length() > 500) {
            throw new IllegalArgumentException("却下理由は500文字以内で入力してください");
        }
    }

    private StampRequestBulkOperationResponse processBulk(
        List<Integer> requestIds,
        BiConsumer<StampRequest, OffsetDateTime> updater
    ) {
        if (requestIds == null || requestIds.isEmpty()) {
            throw new IllegalArgumentException("処理対象の申請が選択されていません");
        }

        // バッチサイズ制限（Requirement 4-3）
        if (requestIds.size() > MAX_BULK_SIZE) {
            throw new IllegalArgumentException("一度に処理できる申請は50件までです");
        }

        List<Integer> failedIds = new ArrayList<>();
        int successCount = 0;

        for (Integer requestId : requestIds) {
            if (requestId == null) {
                continue;
            }
            StampRequest request = store.findById(requestId).orElse(null);
            if (request == null || StampRequestStatus.isFinalState(request.getStatus())) {
                failedIds.add(requestId);
                continue;
            }
            OffsetDateTime now = store.now();
            updater.accept(request, now);
            request.setUpdatedAt(now);
            store.save(request);
            successCount++;
        }

        return new StampRequestBulkOperationResponse(successCount, failedIds.size(), failedIds);
    }
}
