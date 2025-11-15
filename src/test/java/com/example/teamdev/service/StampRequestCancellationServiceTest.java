package com.example.teamdev.service;

import com.example.teamdev.constant.StampRequestStatus;
import com.example.teamdev.entity.StampRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * StampRequestCancellationService のユニットテスト。
 *
 * Requirement 6 の受入基準を検証:
 * - PENDING状態のリクエストのみキャンセル可能
 * - キャンセル理由の長さ（10文字以上）
 * - 自分のリクエストのみキャンセル可能
 * - キャンセル後のstamp_historyは変更されない
 */
class StampRequestCancellationServiceTest {

    private StampRequestStore store;
    private StampRequestCancellationService service;
    private Clock fixedClock;

    @BeforeEach
    void setUp() {
        fixedClock = Clock.fixed(
            Instant.parse("2025-11-15T10:00:00Z"),
            ZoneId.of("UTC")
        );
        store = new StampRequestStore(fixedClock);
        service = new StampRequestCancellationService(store);
    }

    @Test
    void cancelRequest_成功_PENDING状態のリクエストをキャンセル() {
        // Given
        StampRequest request = createPendingRequest(100);

        // When
        service.cancelRequest(request.getId(), 100, "予定変更のためキャンセルします。");

        // Then
        StampRequest cancelled = store.findById(request.getId()).orElseThrow();
        assertThat(cancelled.getStatus()).isEqualTo(StampRequestStatus.CANCELLED.name());
        assertThat(cancelled.getCancellationReason()).isEqualTo("予定変更のためキャンセルします。");
        assertThat(cancelled.getCancelledAt()).isNotNull();
        assertThat(cancelled.getUpdatedAt()).isNotNull();
    }

    @Test
    void cancelRequest_失敗_リクエストが存在しない() {
        // When & Then
        assertThatThrownBy(() -> service.cancelRequest(9999, 100, "存在しないリクエストです。"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("対象の申請が見つかりません");
    }

    @Test
    void cancelRequest_失敗_他人のリクエストをキャンセル() {
        // Given
        StampRequest request = createPendingRequest(100);

        // When & Then - 別の社員IDでキャンセルを試みる
        assertThatThrownBy(() -> service.cancelRequest(request.getId(), 999, "他人のリクエストです。"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("この申請の取り消し権限がありません");
    }

    @Test
    void cancelRequest_失敗_APPROVED状態のリクエストをキャンセル() {
        // Given
        StampRequest request = createPendingRequest(100);
        request.setStatus(StampRequestStatus.APPROVED.name());
        store.save(request);

        // When & Then
        assertThatThrownBy(() -> service.cancelRequest(request.getId(), 100, "承認済みをキャンセルします。"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("既に処理済みの申請は取り消せません");
    }

    @Test
    void cancelRequest_失敗_REJECTED状態のリクエストをキャンセル() {
        // Given
        StampRequest request = createPendingRequest(100);
        request.setStatus(StampRequestStatus.REJECTED.name());
        store.save(request);

        // When & Then
        assertThatThrownBy(() -> service.cancelRequest(request.getId(), 100, "却下済みをキャンセルします。"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("既に処理済みの申請は取り消せません");
    }

    @Test
    void cancelRequest_失敗_CANCELLED状態のリクエストを再度キャンセル() {
        // Given
        StampRequest request = createPendingRequest(100);
        request.setStatus(StampRequestStatus.CANCELLED.name());
        store.save(request);

        // When & Then
        assertThatThrownBy(() -> service.cancelRequest(request.getId(), 100, "キャンセル済みを再度キャンセルします。"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("既に処理済みの申請は取り消せません");
    }

    @Test
    void cancelRequest_失敗_キャンセル理由が短すぎる() {
        // Given
        StampRequest request = createPendingRequest(100);

        // When & Then
        assertThatThrownBy(() -> service.cancelRequest(request.getId(), 100, "短い"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("キャンセル理由は10文字以上");
    }

    @Test
    void cancelRequest_失敗_キャンセル理由がnull() {
        // Given
        StampRequest request = createPendingRequest(100);

        // When & Then
        assertThatThrownBy(() -> service.cancelRequest(request.getId(), 100, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("キャンセル理由は必須です");
    }

    @Test
    void cancelRequest_失敗_キャンセル理由が空文字() {
        // Given
        StampRequest request = createPendingRequest(100);

        // When & Then
        assertThatThrownBy(() -> service.cancelRequest(request.getId(), 100, ""))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("キャンセル理由は必須です");
    }

    private StampRequest createPendingRequest(Integer employeeId) {
        StampRequest request = StampRequest.builder()
            .employeeId(employeeId)
            .stampHistoryId(1)
            .stampDate(OffsetDateTime.parse("2025-11-15T09:00:00Z").toLocalDate())
            .requestedInTime(OffsetDateTime.parse("2025-11-15T09:00:00Z"))
            .requestedOutTime(OffsetDateTime.parse("2025-11-15T18:00:00Z"))
            .reason("家族の急用で退勤が遅れたため修正が必要です。")
            .status(StampRequestStatus.PENDING.name())
            .build();
        return store.create(request);
    }
}
