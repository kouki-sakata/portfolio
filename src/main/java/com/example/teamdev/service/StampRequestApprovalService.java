package com.example.teamdev.service;

import com.example.teamdev.constant.StampRequestStatus;
import com.example.teamdev.entity.StampRequest;
import java.time.OffsetDateTime;
import org.springframework.stereotype.Service;

/**
 * 打刻修正リクエストの承認・却下を扱うサービス。
 *
 * Requirement 3, 7, 8, 9 の受入基準を実装:
 * - 承認ノート（オプショナル、最大500文字）
 * - 却下理由（必須、10-500文字）
 * - PENDING状態のみ処理可能
 */
@Service
public class StampRequestApprovalService {

    private final StampRequestStore store;

    public StampRequestApprovalService(StampRequestStore store) {
        this.store = store;
    }

    public void approveRequest(Integer requestId, Integer approverId, String approvalNote) {
        if (approverId == null) {
            throw new IllegalArgumentException("承認者が指定されていません");
        }

        // 承認ノートの検証（オプショナルだが指定された場合は長さチェック）
        if (approvalNote != null && approvalNote.length() > 500) {
            throw new IllegalArgumentException("承認ノートは500文字以内で入力してください");
        }

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
        if (rejecterId == null) {
            throw new IllegalArgumentException("却下者が指定されていません");
        }

        // 却下理由の検証（Requirement 3-6）
        validateRejectionReason(rejectionReason);

        StampRequest request = findEditableRequest(requestId);
        OffsetDateTime now = store.now();
        request.setStatus(StampRequestStatus.REJECTED.name());
        request.setRejectionReason(rejectionReason);
        request.setRejectionEmployeeId(rejecterId);
        request.setRejectedAt(now);
        request.setUpdatedAt(now);
        store.save(request);
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

    private StampRequest findEditableRequest(Integer requestId) {
        return store.findById(requestId)
            .filter(request -> !StampRequestStatus.isFinalState(request.getStatus()))
            .orElseThrow(() -> new IllegalArgumentException("対象の申請は存在しないか既に処理済みです"));
    }
}
