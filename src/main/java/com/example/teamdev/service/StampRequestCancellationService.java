package com.example.teamdev.service;

import com.example.teamdev.constant.StampRequestStatus;
import com.example.teamdev.entity.StampRequest;
import java.time.OffsetDateTime;
import java.util.Objects;
import org.springframework.stereotype.Service;

/**
 * 打刻修正リクエストの取消操作を扱うサービス。
 */
@Service
public class StampRequestCancellationService {

    private final StampRequestStore store;

    public StampRequestCancellationService(StampRequestStore store) {
        this.store = store;
    }

    public void cancelRequest(Integer requestId, Integer employeeId, String cancellationReason) {
        StampRequest request = store.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("対象の申請が見つかりません"));

        if (!Objects.equals(request.getEmployeeId(), employeeId)) {
            throw new IllegalArgumentException("この申請の取り消し権限がありません");
        }

        if (StampRequestStatus.isFinalState(request.getStatus())) {
            throw new IllegalArgumentException("既に処理済みの申請は取り消せません");
        }

        OffsetDateTime now = store.now();
        request.setStatus(StampRequestStatus.CANCELLED.name());
        request.setCancellationReason(cancellationReason);
        request.setCancelledAt(now);
        request.setUpdatedAt(now);
        store.save(request);
    }
}
