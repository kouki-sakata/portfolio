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
 */
@Service
public class StampRequestBulkOperationService {

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
        if (rejectionReason == null || rejectionReason.isBlank()) {
            throw new IllegalArgumentException("却下理由を入力してください");
        }
        return processBulk(requestIds, (request, now) -> {
            request.setStatus(StampRequestStatus.REJECTED.name());
            request.setRejectionReason(rejectionReason);
            request.setRejectionEmployeeId(rejecterId);
            request.setRejectedAt(now);
        });
    }

    private StampRequestBulkOperationResponse processBulk(
        List<Integer> requestIds,
        BiConsumer<StampRequest, OffsetDateTime> updater
    ) {
        if (requestIds == null || requestIds.isEmpty()) {
            throw new IllegalArgumentException("処理対象の申請が選択されていません");
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
