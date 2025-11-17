package com.example.teamdev.service;

import com.example.teamdev.constant.StampRequestStatus;
import com.example.teamdev.dto.api.stamprequest.StampRequestCreateRequest;
import com.example.teamdev.entity.StampHistory;
import com.example.teamdev.entity.StampRequest;
import com.example.teamdev.exception.StampRequestException;
import com.example.teamdev.mapper.StampHistoryMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Objects;

/**
 * 打刻修正リクエストの登録を扱うサービス。
 *
 * Requirements 1, 9 の受入基準を実装:
 * - 理由の必須検証
 * - 未来日付の拒否
 * - 時刻の妥当性・順序検証
 * - 休憩時間の検証
 * - 重複リクエストの防止
 */
@Service
public class StampRequestRegistrationService {

    private final StampRequestStore store;
    private final StampHistoryMapper stampHistoryMapper;

    public StampRequestRegistrationService(StampRequestStore store, StampHistoryMapper stampHistoryMapper) {
        this.store = store;
        this.stampHistoryMapper = stampHistoryMapper;
    }

    @Transactional
    public StampRequest createRequest(StampRequestCreateRequest request, Integer employeeId) {
        if (employeeId == null) {
            throw new IllegalArgumentException("社員IDが指定されていません");
        }

        // 理由の必須検証（Requirement 1-4, 9-8）
        validateReason(request.reason());

        // 時刻の検証（Requirement 9-1, 9-2, 9-3, 9-4）
        validateTimes(request);

        // 勤怠記録の存在と所有者チェック（stampHistoryIdがnullの場合はOptional.empty()）
        java.util.Optional<StampHistory> stampHistoryOpt = findOwnedStampHistory(request.stampHistoryId(), employeeId);

        // stamp_dateの決定（重複チェックで使用）
        LocalDate stampDate = resolveStampDate(stampHistoryOpt, request);

        // 重複リクエストの検証（Requirement 1-7）
        validateNoDuplicateRequest(request.stampHistoryId(), employeeId, stampDate);

        // original値のスナップショット（stampHistoryがない場合はすべてnull）
        OffsetDateTime originalInTime = stampHistoryOpt.map(StampHistory::getInTime).orElse(null);
        OffsetDateTime originalOutTime = stampHistoryOpt.map(StampHistory::getOutTime).orElse(null);
        OffsetDateTime originalBreakStart = stampHistoryOpt.map(StampHistory::getBreakStartTime).orElse(null);
        OffsetDateTime originalBreakEnd = stampHistoryOpt.map(StampHistory::getBreakEndTime).orElse(null);
        Boolean originalIsNightShift = stampHistoryOpt.map(StampHistory::getIsNightShift).orElse(null);

        Boolean requestedIsNightShift = request.requestedIsNightShift() != null
            ? request.requestedIsNightShift()
            : originalIsNightShift;

        StampRequest stampRequest = StampRequest.builder()
            .employeeId(employeeId)
            .stampHistoryId(request.stampHistoryId())
            .stampDate(stampDate)
            .originalInTime(originalInTime)
            .originalOutTime(originalOutTime)
            .originalBreakStartTime(originalBreakStart)
            .originalBreakEndTime(originalBreakEnd)
            .originalIsNightShift(originalIsNightShift)
            .requestedInTime(request.requestedInTime())
            .requestedOutTime(request.requestedOutTime())
            .requestedBreakStartTime(request.requestedBreakStartTime())
            .requestedBreakEndTime(request.requestedBreakEndTime())
            .requestedIsNightShift(requestedIsNightShift)
            .reason(request.reason())
            .status(StampRequestStatus.PENDING.name())
            .build();

        return store.create(stampRequest);
    }

    private void validateReason(String reason) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("理由は必須です");
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
        if (breakStart != null || breakEnd != null) {
            // 両方指定されているか確認
            if (breakStart == null || breakEnd == null) {
                throw new IllegalArgumentException("休憩時間は開始と終了の両方を指定する必要があります");
            }

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

    private void validateNoDuplicateRequest(Integer stampHistoryId, Integer employeeId, LocalDate stampDate) {
        if (stampHistoryId != null) {
            // 打刻レコードありの場合: employee_id + stamp_history_id で重複チェック
            store.findPendingByEmployeeIdAndStampHistoryId(employeeId, stampHistoryId)
                .ifPresent(existing -> {
                    throw new StampRequestException(HttpStatus.CONFLICT, "この勤怠記録に対して既に申請中のリクエストが存在します");
                });
        } else {
            // 打刻レコードなしの場合: employee_id + stamp_date で重複チェック
            store.findPendingByEmployeeIdAndStampDate(employeeId, stampDate)
                .ifPresent(existing -> {
                    throw new StampRequestException(HttpStatus.CONFLICT, "この日付に対して既に申請中のリクエストが存在します");
                });
        }
    }

    private java.util.Optional<StampHistory> findOwnedStampHistory(Integer stampHistoryId, Integer employeeId) {
        if (stampHistoryId == null) {
            return java.util.Optional.empty();
        }

        StampHistory history = stampHistoryMapper.getById(stampHistoryId)
            .orElseThrow(() -> new StampRequestException(HttpStatus.NOT_FOUND, "対象の勤怠記録が見つかりません"));

        if (!Objects.equals(history.getEmployeeId(), employeeId)) {
            throw new StampRequestException(HttpStatus.FORBIDDEN, "自分の勤怠記録のみ申請できます");
        }
        return java.util.Optional.of(history);
    }

    private LocalDate resolveStampDate(java.util.Optional<StampHistory> historyOpt, StampRequestCreateRequest request) {
        // requestedInTime から優先的に導出
        if (request.requestedInTime() != null) {
            return request.requestedInTime().toLocalDate();
        }

        // stampHistory が存在する場合はそこから取得
        if (historyOpt.isPresent()) {
            StampHistory history = historyOpt.get();
            if (history.getStampDate() != null) {
                return history.getStampDate();
            }
            if (history.getYear() != null && history.getMonth() != null && history.getDay() != null) {
                return LocalDate.of(
                    Integer.parseInt(history.getYear()),
                    Integer.parseInt(history.getMonth()),
                    Integer.parseInt(history.getDay())
                );
            }
        }

        // フォールバック: 現在日付
        return store.now().toLocalDate();
    }
}
