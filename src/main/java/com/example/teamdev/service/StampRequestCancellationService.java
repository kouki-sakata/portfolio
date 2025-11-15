package com.example.teamdev.service;

import com.example.teamdev.constant.StampRequestStatus;
import com.example.teamdev.entity.StampRequest;
import java.time.OffsetDateTime;
import java.util.Objects;
import org.springframework.stereotype.Service;

/**
 * 打刻修正リクエストの取消操作を扱うサービス。
 *
 * Requirement 6 の受入基準を実装:
 * - PENDING状態のリクエストのみキャンセル可能
 * - キャンセル理由の長さ検証（10文字以上）
 * - 自分のリクエストのみキャンセル可能
 */
@Service
public class StampRequestCancellationService {

    private final StampRequestStore store;

    public StampRequestCancellationService(StampRequestStore store) {
        this.store = store;
    }

    public void cancelRequest(Integer requestId, Integer employeeId, String cancellationReason) {
        // リクエストの存在確認
        StampRequest request = store.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("対象の申請が見つかりません"));

        // 権限確認（Requirement 6-1, 8-3）
        if (!Objects.equals(request.getEmployeeId(), employeeId)) {
            throw new IllegalArgumentException("この申請の取り消し権限がありません");
        }

        // ステータス確認（Requirement 6-5）
        if (StampRequestStatus.isFinalState(request.getStatus())) {
            throw new IllegalArgumentException("既に処理済みの申請は取り消せません");
        }

        // キャンセル理由の検証（Requirement 6-2）
        validateCancellationReason(cancellationReason);

        // キャンセル処理
        OffsetDateTime now = store.now();
        request.setStatus(StampRequestStatus.CANCELLED.name());
        request.setCancellationReason(cancellationReason);
        request.setCancelledAt(now);
        request.setUpdatedAt(now);
        store.save(request);
    }

    private void validateCancellationReason(String reason) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("キャンセル理由は必須です");
        }
        if (reason.length() < 10) {
            throw new IllegalArgumentException("キャンセル理由は10文字以上で入力してください");
        }
    }
}
