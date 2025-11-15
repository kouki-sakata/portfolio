package com.example.teamdev.service;

import com.example.teamdev.constant.StampRequestStatus;
import com.example.teamdev.dto.api.stamprequest.StampRequestBulkOperationResponse;
import com.example.teamdev.entity.StampRequest;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.function.BiConsumer;
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

    private static final int MAX_BULK_SIZE = 50;

    private final StampRequestStore store;

    public StampRequestBulkOperationService(StampRequestStore store) {
        this.store = store;
    }

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

        return processBulk(requestIds, (request, now) -> {
            request.setStatus(StampRequestStatus.APPROVED.name());
            request.setApprovalNote(approvalNote);
            request.setApprovalEmployeeId(approverId);
            request.setApprovedAt(now);
        });
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
