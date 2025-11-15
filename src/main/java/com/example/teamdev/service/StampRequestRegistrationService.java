package com.example.teamdev.service;

import com.example.teamdev.constant.StampRequestStatus;
import com.example.teamdev.dto.api.stamprequest.StampRequestCreateRequest;
import com.example.teamdev.entity.StampRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * 打刻修正リクエストの登録を扱うサービス。
 *
 * Requirements 1, 9 の受入基準を実装:
 * - 理由の長さ検証（10-500文字）
 * - 未来日付の拒否
 * - 時刻の妥当性・順序検証
 * - 休憩時間の検証
 * - 重複リクエストの防止
 */
@Service
public class StampRequestRegistrationService {

    private final StampRequestStore store;

    public StampRequestRegistrationService(StampRequestStore store) {
        this.store = store;
    }

    public StampRequest createRequest(StampRequestCreateRequest request, Integer employeeId) {
        if (employeeId == null) {
            throw new IllegalArgumentException("社員IDが指定されていません");
        }

        // 理由の長さ検証（Requirement 1-4, 9-8）
        validateReason(request.reason());

        // 時刻の検証（Requirement 9-1, 9-2, 9-3, 9-4）
        validateTimes(request);

        // 重複リクエストの検証（Requirement 1-7）
        validateNoDuplicatePendingRequest(request.stampHistoryId(), employeeId);

        LocalDate stampDate = request.requestedInTime() != null
            ? request.requestedInTime().toLocalDate()
            : store.now().toLocalDate();

        StampRequest stampRequest = StampRequest.builder()
            .employeeId(employeeId)
            .stampHistoryId(request.stampHistoryId())
            .stampDate(stampDate)
            .requestedInTime(request.requestedInTime())
            .requestedOutTime(request.requestedOutTime())
            .requestedBreakStartTime(request.requestedBreakStartTime())
            .requestedBreakEndTime(request.requestedBreakEndTime())
            .requestedIsNightShift(request.requestedIsNightShift())
            .reason(request.reason())
            .status(StampRequestStatus.PENDING.name())
            .build();

        return store.create(stampRequest);
    }

    private void validateReason(String reason) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("理由は必須です");
        }
        if (reason.length() < 10) {
            throw new IllegalArgumentException("理由は10文字以上で入力してください");
        }
        if (reason.length() > 500) {
            throw new IllegalArgumentException("理由は500文字以内で入力してください");
        }
    }

    private void validateTimes(StampRequestCreateRequest request) {
        OffsetDateTime inTime = request.requestedInTime();
        OffsetDateTime outTime = request.requestedOutTime();
        OffsetDateTime breakStart = request.requestedBreakStartTime();
        OffsetDateTime breakEnd = request.requestedBreakEndTime();

        if (inTime == null) {
            throw new IllegalArgumentException("出勤時刻は必須です");
        }

        // 未来日付チェック（Requirement 9-1）
        if (inTime.isAfter(store.now())) {
            throw new IllegalArgumentException("出勤時刻は未来の時刻を指定できません");
        }

        // 退勤時刻が出勤時刻より後（Requirement 1-3）
        if (outTime != null && !outTime.isAfter(inTime)) {
            throw new IllegalArgumentException("退勤時刻は出勤時刻より後である必要があります");
        }

        // 休憩時間の検証（Requirement 9-3, 9-4）
        if (breakStart != null && breakEnd != null) {
            // 休憩開始 < 休憩終了
            if (!breakEnd.isAfter(breakStart)) {
                throw new IllegalArgumentException("休憩終了時刻は休憩開始時刻より後である必要があります");
            }

            // 休憩時間が勤務時間内
            if (breakStart.isBefore(inTime) || (outTime != null && breakEnd.isAfter(outTime))) {
                throw new IllegalArgumentException("休憩時間は出勤時刻と退勤時刻の間である必要があります");
            }
        }
    }

    private void validateNoDuplicatePendingRequest(Integer stampHistoryId, Integer employeeId) {
        boolean hasPendingRequest = store.findAll().stream()
            .anyMatch(r ->
                r.getStampHistoryId().equals(stampHistoryId) &&
                r.getEmployeeId().equals(employeeId) &&
                StampRequestStatus.PENDING.name().equals(r.getStatus())
            );

        if (hasPendingRequest) {
            throw new IllegalArgumentException("この勤怠記録に対して既に申請中のリクエストが存在します");
        }
    }
}
