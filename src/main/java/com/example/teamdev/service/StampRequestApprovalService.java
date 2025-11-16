package com.example.teamdev.service;

import com.example.teamdev.constant.StampRequestStatus;
import com.example.teamdev.entity.StampHistory;
import com.example.teamdev.entity.StampRequest;
import com.example.teamdev.exception.StampRequestException;
import com.example.teamdev.mapper.StampHistoryMapper;
import java.time.OffsetDateTime;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final StampHistoryMapper stampHistoryMapper;

    public StampRequestApprovalService(StampRequestStore store, StampHistoryMapper stampHistoryMapper) {
        this.store = store;
        this.stampHistoryMapper = stampHistoryMapper;
    }

    @Transactional
    public StampRequest approveRequest(Integer requestId, Integer approverId, String approvalNote) {
        if (approverId == null) {
            throw new IllegalArgumentException("承認者が指定されていません");
        }

        // 承認ノートの検証（オプショナルだが指定された場合は長さチェック）
        if (approvalNote != null && approvalNote.length() > 500) {
            throw new IllegalArgumentException("承認ノートは500文字以内で入力してください");
        }

        StampRequest request = findEditableRequest(requestId);
        StampHistory history = loadStampHistory(request);
        assertStampHistorySnapshot(history, request);
        OffsetDateTime now = store.now();
        applyRequestedValuesToHistory(history, request, approverId, now);
        stampHistoryMapper.update(history);
        request.setStatus(StampRequestStatus.APPROVED.name());
        request.setApprovalNote(approvalNote);
        request.setApprovalEmployeeId(approverId);
        request.setApprovedAt(now);
        request.setUpdatedAt(now);
        return store.save(request);
    }

    @Transactional
    public StampRequest rejectRequest(Integer requestId, Integer rejecterId, String rejectionReason) {
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
        return store.save(request);
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
        StampRequest request = store.findById(requestId)
            .orElseThrow(() -> new StampRequestException(
                HttpStatus.NOT_FOUND,
                "対象の申請は存在しないか既に処理済みです"
            ));

        if (StampRequestStatus.isFinalState(request.getStatus())) {
            throw new StampRequestException(HttpStatus.CONFLICT, "対象の申請は存在しないか既に処理済みです");
        }
        return request;
    }

    private StampHistory loadStampHistory(StampRequest request) {
        return stampHistoryMapper.getById(request.getStampHistoryId())
            .orElseThrow(() -> new StampRequestException(HttpStatus.NOT_FOUND, "対象の勤怠記録が見つかりません"));
    }

    private void assertStampHistorySnapshot(StampHistory history, StampRequest request) {
        if (!Objects.equals(history.getInTime(), request.getOriginalInTime())
            || !Objects.equals(history.getOutTime(), request.getOriginalOutTime())
            || !Objects.equals(history.getBreakStartTime(), request.getOriginalBreakStartTime())
            || !Objects.equals(history.getBreakEndTime(), request.getOriginalBreakEndTime())
            || !Objects.equals(history.getIsNightShift(), request.getOriginalIsNightShift())) {
            throw new StampRequestException(HttpStatus.CONFLICT, "対象の勤怠記録は既に変更されています");
        }
    }

    /**
     * リクエストされた値を勤怠履歴に適用します。
     *
     * <p>各フィールドは null でない場合のみ更新されます。
     * これにより、リクエストで指定されていない値は既存の勤怠履歴の値が保持されます。</p>
     *
     * @param history 更新対象の勤怠履歴
     * @param request 承認するリクエスト
     * @param approverId 承認者ID
     * @param now 更新日時
     */
    private void applyRequestedValuesToHistory(
        StampHistory history,
        StampRequest request,
        Integer approverId,
        OffsetDateTime now
    ) {
        // 出勤時刻：リクエストで指定されている場合のみ更新
        if (request.getRequestedInTime() != null) {
            history.setInTime(request.getRequestedInTime());
        }
        // 退勤時刻：リクエストで指定されている場合のみ更新
        if (request.getRequestedOutTime() != null) {
            history.setOutTime(request.getRequestedOutTime());
        }
        // 休憩開始時刻：リクエストで指定されている場合のみ更新（既存値を保持）
        if (request.getRequestedBreakStartTime() != null) {
            history.setBreakStartTime(request.getRequestedBreakStartTime());
        }
        // 休憩終了時刻：リクエストで指定されている場合のみ更新（既存値を保持）
        if (request.getRequestedBreakEndTime() != null) {
            history.setBreakEndTime(request.getRequestedBreakEndTime());
        }
        // 夜勤フラグ：リクエストで指定されている場合のみ更新
        if (request.getRequestedIsNightShift() != null) {
            history.setIsNightShift(request.getRequestedIsNightShift());
        }
        history.setUpdateEmployeeId(approverId);
        history.setUpdateDate(now);
        syncDateColumns(history);
    }

    private void syncDateColumns(StampHistory history) {
        if (history.getStampDate() != null) {
            history.setYear(String.format("%04d", history.getStampDate().getYear()));
            history.setMonth(String.format("%02d", history.getStampDate().getMonthValue()));
            history.setDay(String.format("%02d", history.getStampDate().getDayOfMonth()));
        }
    }
}
