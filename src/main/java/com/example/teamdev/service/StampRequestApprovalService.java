package com.example.teamdev.service;

import com.example.teamdev.constant.StampRequestStatus;
import com.example.teamdev.entity.StampRequest;
import java.time.OffsetDateTime;
import org.springframework.stereotype.Service;

/**
 * 打刻修正リクエストの承認・却下を扱うサービス。
 */
@Service
public class StampRequestApprovalService {

    private final StampRequestStore store;

    public StampRequestApprovalService(StampRequestStore store) {
        this.store = store;
    }

    public void approveRequest(Integer requestId, Integer approverId, String approvalNote) {
        StampRequest request = findEditableRequest(requestId);
        OffsetDateTime now = store.now();
        request.setStatus(StampRequestStatus.APPROVED.name());
        request.setApprovalNote(approvalNote);
        request.setApprovalEmployeeId(approverId);
        request.setApprovedAt(now);
        request.setUpdatedAt(now);
        store.save(request);
    }

    public void rejectRequest(Integer requestId, Integer rejecterId, String rejectionReason) {
        StampRequest request = findEditableRequest(requestId);
        OffsetDateTime now = store.now();
        request.setStatus(StampRequestStatus.REJECTED.name());
        request.setRejectionReason(rejectionReason);
        request.setRejectionEmployeeId(rejecterId);
        request.setRejectedAt(now);
        request.setUpdatedAt(now);
        store.save(request);
    }

    private StampRequest findEditableRequest(Integer requestId) {
        return store.findById(requestId)
            .filter(request -> !StampRequestStatus.isFinalState(request.getStatus()))
            .orElseThrow(() -> new IllegalArgumentException("対象の申請は存在しないか既に処理済みです"));
    }
}
