package com.example.teamdev.service;

import com.example.teamdev.constant.StampRequestStatus;
import com.example.teamdev.dto.api.stamprequest.StampRequestBulkOperationResponse;
import com.example.teamdev.entity.StampRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * StampRequestBulkOperationService のユニットテスト。
 *
 * Requirement 4 の受入基準を検証:
 * - バルク承認/却下（≤50件）
 * - 部分的成功の報告
 * - 共通却下理由
 */
class StampRequestBulkOperationServiceTest {

    private StampRequestStore store;
    private StampRequestBulkOperationService service;
    private Clock fixedClock;

    @BeforeEach
    void setUp() {
        fixedClock = Clock.fixed(
            Instant.parse("2025-11-15T10:00:00Z"),
            ZoneId.of("UTC")
        );
        store = new StampRequestStore(fixedClock);
        service = new StampRequestBulkOperationService(store);
    }

    @Test
    void bulkApprove_成功_複数リクエストを一括承認() {
        // Given
        StampRequest req1 = createPendingRequest(100, 1);
        StampRequest req2 = createPendingRequest(101, 2);
        StampRequest req3 = createPendingRequest(102, 3);
        List<Integer> ids = Arrays.asList(req1.getId(), req2.getId(), req3.getId());

        // When
        StampRequestBulkOperationResponse response = service.bulkApprove(ids, 200, "一括承認しました。");

        // Then
        assertThat(response.successCount()).isEqualTo(3);
        assertThat(response.failureCount()).isEqualTo(0);
        assertThat(response.failedRequestIds()).isEmpty();

        // すべて承認済みになっているか確認
        assertThat(store.findById(req1.getId()).orElseThrow().getStatus())
            .isEqualTo(StampRequestStatus.APPROVED.name());
        assertThat(store.findById(req2.getId()).orElseThrow().getStatus())
            .isEqualTo(StampRequestStatus.APPROVED.name());
        assertThat(store.findById(req3.getId()).orElseThrow().getStatus())
            .isEqualTo(StampRequestStatus.APPROVED.name());
    }

    @Test
    void bulkApprove_成功_承認ノートなし() {
        // Given
        StampRequest req1 = createPendingRequest(100, 1);
        List<Integer> ids = List.of(req1.getId());

        // When
        StampRequestBulkOperationResponse response = service.bulkApprove(ids, 200, null);

        // Then
        assertThat(response.successCount()).isEqualTo(1);
        StampRequest approved = store.findById(req1.getId()).orElseThrow();
        assertThat(approved.getApprovalNote()).isNull();
    }

    @Test
    void bulkApprove_部分的成功_一部のリクエストが既に処理済み() {
        // Given
        StampRequest req1 = createPendingRequest(100, 1);
        StampRequest req2 = createPendingRequest(101, 2);
        StampRequest req3 = createPendingRequest(102, 3);

        // req2を先に承認済みにする
        req2.setStatus(StampRequestStatus.APPROVED.name());
        store.save(req2);

        List<Integer> ids = Arrays.asList(req1.getId(), req2.getId(), req3.getId());

        // When
        StampRequestBulkOperationResponse response = service.bulkApprove(ids, 200, null);

        // Then
        assertThat(response.successCount()).isEqualTo(2);
        assertThat(response.failureCount()).isEqualTo(1);
        assertThat(response.failedRequestIds()).containsExactly(req2.getId());
    }

    @Test
    void bulkApprove_部分的成功_存在しないIDを含む() {
        // Given
        StampRequest req1 = createPendingRequest(100, 1);
        List<Integer> ids = Arrays.asList(req1.getId(), 9999, 9998);

        // When
        StampRequestBulkOperationResponse response = service.bulkApprove(ids, 200, null);

        // Then
        assertThat(response.successCount()).isEqualTo(1);
        assertThat(response.failureCount()).isEqualTo(2);
        assertThat(response.failedRequestIds()).containsExactlyInAnyOrder(9999, 9998);
    }

    @Test
    void bulkApprove_失敗_50件を超える() {
        // Given - 51件のリクエスト
        List<Integer> ids = new ArrayList<>();
        for (int i = 0; i < 51; i++) {
            ids.add(createPendingRequest(100 + i, i + 1).getId());
        }

        // When & Then
        assertThatThrownBy(() -> service.bulkApprove(ids, 200, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("一度に処理できる申請は50件までです");
    }

    @Test
    void bulkApprove_成功_ちょうど50件() {
        // Given - ちょうど50件
        List<Integer> ids = new ArrayList<>();
        for (int i = 0; i < 50; i++) {
            ids.add(createPendingRequest(100 + i, i + 1).getId());
        }

        // When
        StampRequestBulkOperationResponse response = service.bulkApprove(ids, 200, null);

        // Then
        assertThat(response.successCount()).isEqualTo(50);
        assertThat(response.failureCount()).isEqualTo(0);
    }

    @Test
    void bulkApprove_失敗_リクエストIDリストがnull() {
        // When & Then
        assertThatThrownBy(() -> service.bulkApprove(null, 200, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("処理対象の申請が選択されていません");
    }

    @Test
    void bulkApprove_失敗_リクエストIDリストが空() {
        // When & Then
        assertThatThrownBy(() -> service.bulkApprove(List.of(), 200, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("処理対象の申請が選択されていません");
    }

    @Test
    void bulkApprove_失敗_承認者IDがnull() {
        // Given
        StampRequest req1 = createPendingRequest(100, 1);

        // When & Then
        assertThatThrownBy(() -> service.bulkApprove(List.of(req1.getId()), null, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("承認者が指定されていません");
    }

    @Test
    void bulkReject_成功_複数リクエストを一括却下() {
        // Given
        StampRequest req1 = createPendingRequest(100, 1);
        StampRequest req2 = createPendingRequest(101, 2);
        StampRequest req3 = createPendingRequest(102, 3);
        List<Integer> ids = Arrays.asList(req1.getId(), req2.getId(), req3.getId());
        String rejectionReason = "時間外労働の承認が得られていないため一括却下します。";

        // When
        StampRequestBulkOperationResponse response = service.bulkReject(ids, 200, rejectionReason);

        // Then
        assertThat(response.successCount()).isEqualTo(3);
        assertThat(response.failureCount()).isEqualTo(0);

        // すべて却下済みになっているか確認
        assertThat(store.findById(req1.getId()).orElseThrow().getStatus())
            .isEqualTo(StampRequestStatus.REJECTED.name());
        assertThat(store.findById(req1.getId()).orElseThrow().getRejectionReason())
            .isEqualTo(rejectionReason);
    }

    @Test
    void bulkReject_失敗_却下理由がnull() {
        // Given
        StampRequest req1 = createPendingRequest(100, 1);

        // When & Then
        assertThatThrownBy(() -> service.bulkReject(List.of(req1.getId()), 200, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("却下理由は必須です");
    }

    @Test
    void bulkReject_失敗_却下理由が空文字() {
        // Given
        StampRequest req1 = createPendingRequest(100, 1);

        // When & Then
        assertThatThrownBy(() -> service.bulkReject(List.of(req1.getId()), 200, ""))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("却下理由は必須です");
    }

    @Test
    void bulkReject_失敗_却下理由が短すぎる() {
        // Given
        StampRequest req1 = createPendingRequest(100, 1);

        // When & Then
        assertThatThrownBy(() -> service.bulkReject(List.of(req1.getId()), 200, "短い"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("却下理由は10文字以上");
    }

    @Test
    void bulkReject_失敗_却下者IDがnull() {
        // Given
        StampRequest req1 = createPendingRequest(100, 1);

        // When & Then
        assertThatThrownBy(() -> service.bulkReject(List.of(req1.getId()), null, "却下します。十分な長さです。"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("却下者が指定されていません");
    }

    @Test
    void bulkReject_部分的成功_一部のリクエストがキャンセル済み() {
        // Given
        StampRequest req1 = createPendingRequest(100, 1);
        StampRequest req2 = createPendingRequest(101, 2);

        // req2をキャンセル済みにする
        req2.setStatus(StampRequestStatus.CANCELLED.name());
        store.save(req2);

        List<Integer> ids = Arrays.asList(req1.getId(), req2.getId());

        // When
        StampRequestBulkOperationResponse response = service.bulkReject(
            ids, 200, "一括却下の理由です。十分な長さがあります。"
        );

        // Then
        assertThat(response.successCount()).isEqualTo(1);
        assertThat(response.failureCount()).isEqualTo(1);
        assertThat(response.failedRequestIds()).containsExactly(req2.getId());
    }

    @Test
    void bulkReject_失敗_50件を超える() {
        // Given - 51件のリクエスト
        List<Integer> ids = new ArrayList<>();
        for (int i = 0; i < 51; i++) {
            ids.add(createPendingRequest(100 + i, i + 1).getId());
        }

        // When & Then
        assertThatThrownBy(() -> service.bulkReject(ids, 200, "却下理由です。十分な長さがあります。"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("一度に処理できる申請は50件までです");
    }

    @Test
    void bulkApprove_成功_nullIDをスキップ() {
        // Given
        StampRequest req1 = createPendingRequest(100, 1);
        List<Integer> ids = Arrays.asList(req1.getId(), null, null);

        // When
        StampRequestBulkOperationResponse response = service.bulkApprove(ids, 200, null);

        // Then
        assertThat(response.successCount()).isEqualTo(1);
        assertThat(response.failureCount()).isEqualTo(0);
    }

    private StampRequest createPendingRequest(int employeeId, int stampHistoryId) {
        StampRequest request = StampRequest.builder()
            .employeeId(employeeId)
            .stampHistoryId(stampHistoryId)
            .stampDate(OffsetDateTime.parse("2025-11-15T09:00:00Z").toLocalDate())
            .requestedInTime(OffsetDateTime.parse("2025-11-15T09:00:00Z"))
            .requestedOutTime(OffsetDateTime.parse("2025-11-15T18:00:00Z"))
            .reason("家族の急用で退勤が遅れたため修正が必要です。")
            .status(StampRequestStatus.PENDING.name())
            .build();
        return store.create(request);
    }
}
