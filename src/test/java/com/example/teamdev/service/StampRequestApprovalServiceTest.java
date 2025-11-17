package com.example.teamdev.service;

import com.example.teamdev.constant.StampRequestStatus;
import com.example.teamdev.entity.StampHistory;
import com.example.teamdev.entity.StampRequest;
import com.example.teamdev.exception.StampRequestException;
import com.example.teamdev.mapper.StampHistoryMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * StampRequestApprovalService のユニットテスト。
 *
 * Requirement 3, 7, 8, 9 の受入基準を検証:
 * - 承認ノート（オプショナル、最大500文字）
 * - 却下理由（必須、10-500文字）
 * - PENDING状態のみ処理可能
 * - タイムスタンプと承認者ID の記録
 */
class StampRequestApprovalServiceTest {

    private StampRequestStore store;
    private StampRequestApprovalService service;
    private Clock fixedClock;
    private StampHistoryMapper stampHistoryMapper;

    @BeforeEach
    void setUp() {
        fixedClock = Clock.fixed(
            Instant.parse("2025-11-15T10:00:00Z"),
            ZoneId.of("UTC")
        );
        store = new StampRequestStore(null, fixedClock);
        stampHistoryMapper = mock(StampHistoryMapper.class);
        service = new StampRequestApprovalService(store, stampHistoryMapper);
    }

    @Test
    void approveRequest_成功_承認ノートなし() {
        // Given
        StampRequest request = createPendingRequest();
        mockStampHistoryLookup(request);

        // When
        service.approveRequest(request.getId(), 200, null);

        // Then
        StampRequest approved = store.findById(request.getId()).orElseThrow();
        assertThat(approved.getStatus()).isEqualTo(StampRequestStatus.APPROVED.name());
        assertThat(approved.getApprovalEmployeeId()).isEqualTo(200);
        assertThat(approved.getApprovalNote()).isNull();
        assertThat(approved.getApprovedAt()).isNotNull();
        assertThat(approved.getUpdatedAt()).isNotNull();
    }

    @Test
    void approveRequest_成功_承認ノートあり() {
        // Given
        StampRequest request = createPendingRequest();
        String approvalNote = "内容を確認し、承認しました。";
        mockStampHistoryLookup(request);

        // When
        service.approveRequest(request.getId(), 200, approvalNote);

        // Then
        StampRequest approved = store.findById(request.getId()).orElseThrow();
        assertThat(approved.getStatus()).isEqualTo(StampRequestStatus.APPROVED.name());
        assertThat(approved.getApprovalNote()).isEqualTo(approvalNote);
        assertThat(approved.getApprovalEmployeeId()).isEqualTo(200);
    }

    @Test
    void approveRequest_失敗_承認ノートが長すぎる() {
        // Given
        StampRequest request = createPendingRequest();
        mockStampHistoryLookup(request);
        String longNote = "あ".repeat(501);

        // When & Then
        assertThatThrownBy(() -> service.approveRequest(request.getId(), 200, longNote))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("承認ノートは500文字以内");
    }

    @Test
    void approveRequest_失敗_リクエストが存在しない() {
        // When & Then
        assertThatThrownBy(() -> service.approveRequest(9999, 200, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("対象の申請は存在しないか既に処理済みです");
    }

    @Test
    void approveRequest_失敗_既に承認済み() {
        // Given
        StampRequest request = createPendingRequest();
        mockStampHistoryLookup(request);
        service.approveRequest(request.getId(), 200, null);

        // When & Then - 2回目の承認を試みる
        assertThatThrownBy(() -> service.approveRequest(request.getId(), 200, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("対象の申請は存在しないか既に処理済みです");
    }

    @Test
    void approveRequest_失敗_既に却下済み() {
        // Given
        StampRequest request = createPendingRequest();
        mockStampHistoryLookup(request);
        service.rejectRequest(request.getId(), 200, "理由があって却下します。");

        // When & Then
        assertThatThrownBy(() -> service.approveRequest(request.getId(), 200, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("対象の申請は存在しないか既に処理済みです");
    }

    @Test
    void approveRequest_失敗_既にキャンセル済み() {
        // Given
        StampRequest request = createPendingRequest();
        mockStampHistoryLookup(request);
        request.setStatus(StampRequestStatus.CANCELLED.name());
        store.save(request);

        // When & Then
        assertThatThrownBy(() -> service.approveRequest(request.getId(), 200, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("対象の申請は存在しないか既に処理済みです");
    }

    @Test
    void approveRequest_失敗_承認者IDがnull() {
        // Given
        StampRequest request = createPendingRequest();
        mockStampHistoryLookup(request);

        // When & Then
        assertThatThrownBy(() -> service.approveRequest(request.getId(), null, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("承認者が指定されていません");
    }

    @Test
    void rejectRequest_成功_却下理由あり() {
        // Given
        StampRequest request = createPendingRequest();
        mockStampHistoryLookup(request);
        String rejectionReason = "申請内容に不備があるため却下します。";

        // When
        service.rejectRequest(request.getId(), 200, rejectionReason);

        // Then
        StampRequest rejected = store.findById(request.getId()).orElseThrow();
        assertThat(rejected.getStatus()).isEqualTo(StampRequestStatus.REJECTED.name());
        assertThat(rejected.getRejectionReason()).isEqualTo(rejectionReason);
        assertThat(rejected.getRejectionEmployeeId()).isEqualTo(200);
        assertThat(rejected.getRejectedAt()).isNotNull();
        assertThat(rejected.getUpdatedAt()).isNotNull();
    }

    @Test
    void rejectRequest_失敗_却下理由がnull() {
        // Given
        StampRequest request = createPendingRequest();
        mockStampHistoryLookup(request);

        // When & Then
        assertThatThrownBy(() -> service.rejectRequest(request.getId(), 200, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("却下理由は必須です");
    }

    @Test
    void rejectRequest_失敗_却下理由が空文字() {
        // Given
        StampRequest request = createPendingRequest();

        // When & Then
        assertThatThrownBy(() -> service.rejectRequest(request.getId(), 200, ""))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("却下理由は必須です");
    }

    @Test
    void rejectRequest_失敗_却下理由が空白のみ() {
        // Given
        StampRequest request = createPendingRequest();

        // When & Then
        assertThatThrownBy(() -> service.rejectRequest(request.getId(), 200, "     "))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("却下理由は必須です");
    }

    @Test
    void rejectRequest_失敗_却下理由が短すぎる() {
        // Given
        StampRequest request = createPendingRequest();

        // When & Then
        assertThatThrownBy(() -> service.rejectRequest(request.getId(), 200, "短い"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("却下理由は10文字以上");
    }

    @Test
    void rejectRequest_成功_却下理由が境界値10文字() {
        // Given
        StampRequest request = createPendingRequest();

        // When
        service.rejectRequest(request.getId(), 200, "1234567890");

        // Then
        StampRequest rejected = store.findById(request.getId()).orElseThrow();
        assertThat(rejected.getStatus()).isEqualTo(StampRequestStatus.REJECTED.name());
        assertThat(rejected.getRejectionReason()).isEqualTo("1234567890");
    }

    @Test
    void rejectRequest_失敗_却下理由が長すぎる() {
        // Given
        StampRequest request = createPendingRequest();
        String longReason = "あ".repeat(501);

        // When & Then
        assertThatThrownBy(() -> service.rejectRequest(request.getId(), 200, longReason))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("却下理由は500文字以内");
    }

    @Test
    void rejectRequest_失敗_却下者IDがnull() {
        // Given
        StampRequest request = createPendingRequest();

        // When & Then
        assertThatThrownBy(() -> service.rejectRequest(request.getId(), null, "却下します。十分な長さです。"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("却下者が指定されていません");
    }

    @Test
    void rejectRequest_失敗_リクエストが存在しない() {
        // When & Then
        assertThatThrownBy(() -> service.rejectRequest(9999, 200, "存在しないリクエストです。"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("対象の申請は存在しないか既に処理済みです");
    }

    // ========== stampHistoryId が null のケース（打刻忘れの申請）==========

    @Test
    void approveRequest_成功_stampHistoryIdがnullの場合新規作成() {
        // Given: 打刻忘れの申請（stampHistoryId=null）
        StampRequest request = createForgottenStampRequest();
        mockNoExistingStampHistory(request);
        mockStampHistoryInsert();

        // When
        service.approveRequest(request.getId(), 200, "打刻忘れのため承認します");

        // Then
        StampRequest approved = store.findById(request.getId()).orElseThrow();
        assertThat(approved.getStatus()).isEqualTo(StampRequestStatus.APPROVED.name());
        assertThat(approved.getApprovalEmployeeId()).isEqualTo(200);
        assertThat(approved.getApprovalNote()).isEqualTo("打刻忘れのため承認します");
        assertThat(approved.getStampHistoryId()).isNotNull();
        assertThat(approved.getStampHistoryId()).isEqualTo(999); // モックで設定したID

        // StampHistoryMapper.save() が呼ばれたことを確認
        verify(stampHistoryMapper).save(any(StampHistory.class));
    }

    @Test
    void approveRequest_成功_stampHistoryIdがnullで日付フィールドが正しく設定される() {
        // Given: 打刻忘れの申請（stampHistoryId=null）
        StampRequest request = createForgottenStampRequest();
        mockNoExistingStampHistory(request);

        // StampHistory の内容をキャプチャするモックを設定
        final StampHistory[] capturedHistory = new StampHistory[1];
        doAnswer(invocation -> {
            StampHistory history = invocation.getArgument(0);
            capturedHistory[0] = history;
            history.setId(999); // IDを設定
            return null;
        }).when(stampHistoryMapper).save(any(StampHistory.class));

        // When
        service.approveRequest(request.getId(), 200, null);

        // Then: 日付フィールドが正しく設定されていることを確認
        StampHistory savedHistory = capturedHistory[0];
        assertThat(savedHistory).isNotNull();
        assertThat(savedHistory.getStampDate()).isEqualTo(request.getStampDate());
        assertThat(savedHistory.getYear()).isEqualTo("2025");
        assertThat(savedHistory.getMonth()).isEqualTo("11");
        assertThat(savedHistory.getDay()).isEqualTo("15");
        assertThat(savedHistory.getEmployeeId()).isEqualTo(request.getEmployeeId());
        assertThat(savedHistory.getInTime()).isEqualTo(request.getRequestedInTime());
        assertThat(savedHistory.getOutTime()).isEqualTo(request.getRequestedOutTime());
        assertThat(savedHistory.getUpdateEmployeeId()).isEqualTo(200);
    }

    @Test
    void approveRequest_失敗_stampHistoryIdがnullで既存レコードが存在する() {
        // Given: 打刻忘れの申請（stampHistoryId=null）
        StampRequest request = createForgottenStampRequest();

        // 承認までの間に同じ日付の打刻が既に登録されたケース
        StampHistory existingHistory = new StampHistory(
            888,
            "2025",
            "11",
            "15",
            request.getStampDate(),
            request.getEmployeeId(),
            OffsetDateTime.parse("2025-11-15T08:00:00Z"),
            OffsetDateTime.parse("2025-11-15T17:00:00Z"),
            null,
            null,
            false,
            100,
            OffsetDateTime.now()
        );
        when(stampHistoryMapper.getStampHistoryByStampDateEmployeeId(
            eq(request.getStampDate()),
            eq(request.getEmployeeId())
        )).thenReturn(existingHistory);

        // When & Then
        assertThatThrownBy(() -> service.approveRequest(request.getId(), 200, null))
            .isInstanceOf(StampRequestException.class)
            .hasMessageContaining("この日付の勤怠記録は既に登録されています");
    }

    @Test
    void approveRequest_成功_stampHistoryIdがnullで申請時刻がすべて反映される() {
        // Given: 打刻忘れの申請（休憩時間・夜勤フラグも含む）
        OffsetDateTime requestedIn = OffsetDateTime.parse("2025-11-15T09:00:00Z");
        OffsetDateTime requestedOut = OffsetDateTime.parse("2025-11-15T18:00:00Z");
        OffsetDateTime breakStart = OffsetDateTime.parse("2025-11-15T12:00:00Z");
        OffsetDateTime breakEnd = OffsetDateTime.parse("2025-11-15T13:00:00Z");

        StampRequest request = StampRequest.builder()
            .employeeId(100)
            .stampHistoryId(null) // 打刻忘れ
            .stampDate(OffsetDateTime.parse("2025-11-15T09:00:00Z").toLocalDate())
            .originalInTime(null)
            .originalOutTime(null)
            .originalBreakStartTime(null)
            .originalBreakEndTime(null)
            .originalIsNightShift(null)
            .requestedInTime(requestedIn)
            .requestedOutTime(requestedOut)
            .requestedBreakStartTime(breakStart)
            .requestedBreakEndTime(breakEnd)
            .requestedIsNightShift(true)
            .reason("打刻を完全に忘れていました。")
            .status(StampRequestStatus.PENDING.name())
            .build();
        request = store.create(request);

        mockNoExistingStampHistory(request);

        // StampHistory の内容をキャプチャ
        final StampHistory[] capturedHistory = new StampHistory[1];
        doAnswer(invocation -> {
            StampHistory history = invocation.getArgument(0);
            capturedHistory[0] = history;
            history.setId(999);
            return null;
        }).when(stampHistoryMapper).save(any(StampHistory.class));

        // When
        service.approveRequest(request.getId(), 200, null);

        // Then: 申請された全ての時刻情報が反映されていることを確認
        StampHistory savedHistory = capturedHistory[0];
        assertThat(savedHistory.getInTime()).isEqualTo(requestedIn);
        assertThat(savedHistory.getOutTime()).isEqualTo(requestedOut);
        assertThat(savedHistory.getBreakStartTime()).isEqualTo(breakStart);
        assertThat(savedHistory.getBreakEndTime()).isEqualTo(breakEnd);
        assertThat(savedHistory.getIsNightShift()).isTrue();
    }

    // ========== ヘルパーメソッド ==========

    private StampRequest createPendingRequest() {
        OffsetDateTime originalIn = OffsetDateTime.parse("2025-11-15T08:00:00Z");
        OffsetDateTime originalOut = OffsetDateTime.parse("2025-11-15T17:00:00Z");
        StampRequest request = StampRequest.builder()
            .employeeId(100)
            .stampHistoryId(1)
            .stampDate(OffsetDateTime.parse("2025-11-15T09:00:00Z").toLocalDate())
            .originalInTime(originalIn)
            .originalOutTime(originalOut)
            .requestedInTime(OffsetDateTime.parse("2025-11-15T09:00:00Z"))
            .requestedOutTime(OffsetDateTime.parse("2025-11-15T18:00:00Z"))
            .reason("家族の急用で退勤が遅れたため修正が必要です。")
            .status(StampRequestStatus.PENDING.name())
            .build();
        return store.create(request);
    }

    private void mockStampHistoryLookup(StampRequest request) {
        StampHistory history = new StampHistory(
            request.getStampHistoryId(),
            String.format("%04d", request.getStampDate().getYear()),
            String.format("%02d", request.getStampDate().getMonthValue()),
            String.format("%02d", request.getStampDate().getDayOfMonth()),
            request.getStampDate(),
            request.getEmployeeId(),
            request.getOriginalInTime(),
            request.getOriginalOutTime(),
            request.getOriginalBreakStartTime(),
            request.getOriginalBreakEndTime(),
            request.getOriginalIsNightShift(),
            null,
            request.getCreatedAt()
        );
        when(stampHistoryMapper.getById(request.getStampHistoryId())).thenReturn(Optional.of(history));
    }

    /**
     * 打刻忘れの申請を作成（stampHistoryId=null）
     */
    private StampRequest createForgottenStampRequest() {
        OffsetDateTime requestedIn = OffsetDateTime.parse("2025-11-15T09:00:00Z");
        OffsetDateTime requestedOut = OffsetDateTime.parse("2025-11-15T18:00:00Z");
        StampRequest request = StampRequest.builder()
            .employeeId(100)
            .stampHistoryId(null) // 打刻忘れ
            .stampDate(OffsetDateTime.parse("2025-11-15T09:00:00Z").toLocalDate())
            .originalInTime(null)
            .originalOutTime(null)
            .originalBreakStartTime(null)
            .originalBreakEndTime(null)
            .originalIsNightShift(null)
            .requestedInTime(requestedIn)
            .requestedOutTime(requestedOut)
            .reason("打刻を忘れていました。")
            .status(StampRequestStatus.PENDING.name())
            .build();
        return store.create(request);
    }

    /**
     * 既存の勤怠記録が存在しないことをモック
     */
    private void mockNoExistingStampHistory(StampRequest request) {
        when(stampHistoryMapper.getStampHistoryByStampDateEmployeeId(
            eq(request.getStampDate()),
            eq(request.getEmployeeId())
        )).thenReturn(null);
    }

    /**
     * StampHistory INSERT時にIDを設定するモック
     */
    private void mockStampHistoryInsert() {
        doAnswer(invocation -> {
            StampHistory history = invocation.getArgument(0);
            history.setId(999); // IDを自動設定
            return null;
        }).when(stampHistoryMapper).save(any(StampHistory.class));
    }
}
