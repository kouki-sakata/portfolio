package com.example.teamdev.service;

import com.example.teamdev.constant.StampRequestStatus;
import com.example.teamdev.dto.api.stamprequest.StampRequestCreateRequest;
import com.example.teamdev.entity.StampHistory;
import com.example.teamdev.entity.StampRequest;
import com.example.teamdev.mapper.StampHistoryMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * StampRequestRegistrationService のユニットテスト。
 *
 * Requirement 1, 9 の受入基準を検証:
 * - 理由の長さ（10-500文字）
 * - 未来日付の拒否
 * - 勤務時間の妥当性
 * - 休憩時間の順序と範囲
 * - 重複リクエストの防止
 * - 翌日退勤の調整
 */
class StampRequestRegistrationServiceTest {

    private StampRequestStore store;
    private StampRequestRegistrationService service;
    private Clock fixedClock;
    private StampHistoryMapper stampHistoryMapper;
    private Map<Integer, StampHistory> historyStub;

    @BeforeEach
    void setUp() {
        // 2025-11-15 10:00:00 UTC に固定
        fixedClock = Clock.fixed(
            Instant.parse("2025-11-15T10:00:00Z"),
            ZoneId.of("UTC")
        );
        store = new StampRequestStore(null, fixedClock);
        stampHistoryMapper = mock(StampHistoryMapper.class);
        historyStub = new HashMap<>();
        when(stampHistoryMapper.getById(anyInt())).thenAnswer(invocation -> {
            Integer id = invocation.getArgument(0);
            return Optional.ofNullable(historyStub.get(id));
        });
        service = new StampRequestRegistrationService(store, stampHistoryMapper);
        stubStampHistory(1, 100);
    }

    @Test
    void createRequest_成功_基本的なリクエスト作成() {
        // Given
        OffsetDateTime inTime = OffsetDateTime.parse("2025-11-15T09:00:00Z");
        OffsetDateTime outTime = OffsetDateTime.parse("2025-11-15T18:00:00Z");
        OffsetDateTime breakStart = OffsetDateTime.parse("2025-11-15T12:00:00Z");
        OffsetDateTime breakEnd = OffsetDateTime.parse("2025-11-15T13:00:00Z");

        StampRequestCreateRequest request = new StampRequestCreateRequest(
            1,                                  // stampHistoryId
            inTime,
            outTime,
            breakStart,
            breakEnd,
            false,                              // requestedIsNightShift
            "家族の急用で退勤が遅れたため修正が必要です。"
        );

        // When
        StampRequest result = service.createRequest(request, 100);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isNotNull();
        assertThat(result.getEmployeeId()).isEqualTo(100);
        assertThat(result.getStampHistoryId()).isEqualTo(1);
        assertThat(result.getStatus()).isEqualTo(StampRequestStatus.PENDING.name());
        assertThat(result.getReason()).isEqualTo("家族の急用で退勤が遅れたため修正が必要です。");
        assertThat(result.getCreatedAt()).isNotNull();
        assertThat(result.getUpdatedAt()).isNotNull();
    }

    @Test
    void createRequest_失敗_employeeIdがnull() {
        // Given
        StampRequestCreateRequest request = new StampRequestCreateRequest(
            1,
            OffsetDateTime.parse("2025-11-15T09:00:00Z"),
            OffsetDateTime.parse("2025-11-15T18:00:00Z"),
            null,
            null,
            false,
            "理由を記載します。十分な長さがあります。"
        );

        // When & Then
        assertThatThrownBy(() -> service.createRequest(request, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("社員IDが指定されていません");
    }

    @Test
    void createRequest_失敗_理由がnull() {
        // Given
        StampRequestCreateRequest request = new StampRequestCreateRequest(
            1,
            OffsetDateTime.parse("2025-11-15T09:00:00Z"),
            OffsetDateTime.parse("2025-11-15T18:00:00Z"),
            null,
            null,
            false,
            null  // null
        );

        // When & Then
        assertThatThrownBy(() -> service.createRequest(request, 100))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("理由は必須です");
    }

    @Test
    void createRequest_失敗_理由が空文字() {
        // Given
        StampRequestCreateRequest request = new StampRequestCreateRequest(
            1,
            OffsetDateTime.parse("2025-11-15T09:00:00Z"),
            OffsetDateTime.parse("2025-11-15T18:00:00Z"),
            null,
            null,
            false,
            ""  // 空文字
        );

        // When & Then
        assertThatThrownBy(() -> service.createRequest(request, 100))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("理由は必須です");
    }

    @Test
    void createRequest_失敗_理由が空白のみ() {
        // Given
        StampRequestCreateRequest request = new StampRequestCreateRequest(
            1,
            OffsetDateTime.parse("2025-11-15T09:00:00Z"),
            OffsetDateTime.parse("2025-11-15T18:00:00Z"),
            null,
            null,
            false,
            "          "  // 10文字の空白
        );

        // When & Then
        assertThatThrownBy(() -> service.createRequest(request, 100))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("理由は必須です");
    }

    @Test
    void createRequest_失敗_理由が短すぎる() {
        // Given
        StampRequestCreateRequest request = new StampRequestCreateRequest(
            1,
            OffsetDateTime.parse("2025-11-15T09:00:00Z"),
            OffsetDateTime.parse("2025-11-15T18:00:00Z"),
            null,
            null,
            false,
            "短い"  // 2文字（10文字未満）
        );

        // When & Then
        assertThatThrownBy(() -> service.createRequest(request, 100))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("理由は10文字以上");
    }

    @Test
    void createRequest_成功_理由が境界値10文字() {
        // Given - ちょうど10文字
        StampRequestCreateRequest request = new StampRequestCreateRequest(
            1,
            OffsetDateTime.parse("2025-11-15T09:00:00Z"),
            OffsetDateTime.parse("2025-11-15T18:00:00Z"),
            null,
            null,
            false,
            "1234567890"  // ちょうど10文字
        );

        // When
        StampRequest result = service.createRequest(request, 100);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getReason()).isEqualTo("1234567890");
    }

    @Test
    void createRequest_成功_理由が境界値500文字() {
        // Given - ちょうど500文字
        String reason500 = "あ".repeat(500);
        StampRequestCreateRequest request = new StampRequestCreateRequest(
            1,
            OffsetDateTime.parse("2025-11-15T09:00:00Z"),
            OffsetDateTime.parse("2025-11-15T18:00:00Z"),
            null,
            null,
            false,
            reason500
        );

        // When
        StampRequest result = service.createRequest(request, 100);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getReason()).isEqualTo(reason500);
        assertThat(result.getReason().length()).isEqualTo(500);
    }

    @Test
    void createRequest_失敗_理由が長すぎる() {
        // Given
        String longReason = "あ".repeat(501);  // 501文字
        StampRequestCreateRequest request = new StampRequestCreateRequest(
            1,
            OffsetDateTime.parse("2025-11-15T09:00:00Z"),
            OffsetDateTime.parse("2025-11-15T18:00:00Z"),
            null,
            null,
            false,
            longReason
        );

        // When & Then
        assertThatThrownBy(() -> service.createRequest(request, 100))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("理由は500文字以内");
    }

    @Test
    void createRequest_失敗_出勤時刻が未来() {
        // Given - 現在時刻より後の出勤時刻
        OffsetDateTime futureTime = OffsetDateTime.parse("2025-11-15T11:00:00Z");
        StampRequestCreateRequest request = new StampRequestCreateRequest(
            1,
            futureTime,
            OffsetDateTime.parse("2025-11-15T18:00:00Z"),
            null,
            null,
            false,
            "未来の時刻でリクエストを出します。"
        );

        // When & Then
        assertThatThrownBy(() -> service.createRequest(request, 100))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("出勤時刻は未来の時刻を指定できません");
    }

    @Test
    void createRequest_失敗_時刻の順序が不正_出勤より前に退勤() {
        // Given
        StampRequestCreateRequest request = new StampRequestCreateRequest(
            1,
            OffsetDateTime.parse("2025-11-15T09:00:00Z"),  // 出勤が09:00
            OffsetDateTime.parse("2025-11-15T08:00:00Z"),  // 退勤が08:00（出勤より前）
            null,
            null,
            false,
            "時刻の順序が不正なリクエストです。"
        );

        // When & Then
        assertThatThrownBy(() -> service.createRequest(request, 100))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("退勤時刻は出勤時刻より後");
    }

    @Test
    void createRequest_失敗_休憩開始が休憩終了より後() {
        // Given
        StampRequestCreateRequest request = new StampRequestCreateRequest(
            1,
            OffsetDateTime.parse("2025-11-15T09:00:00Z"),
            OffsetDateTime.parse("2025-11-15T18:00:00Z"),
            OffsetDateTime.parse("2025-11-15T13:00:00Z"),  // 終了より後
            OffsetDateTime.parse("2025-11-15T12:00:00Z"),
            false,
            "休憩時刻の順序が不正なリクエストです。"
        );

        // When & Then
        assertThatThrownBy(() -> service.createRequest(request, 100))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("休憩終了時刻は休憩開始時刻より後");
    }

    @Test
    void createRequest_失敗_休憩が勤務時間外_出勤前() {
        // Given
        StampRequestCreateRequest request = new StampRequestCreateRequest(
            1,
            OffsetDateTime.parse("2025-11-15T09:00:00Z"),
            OffsetDateTime.parse("2025-11-15T18:00:00Z"),
            OffsetDateTime.parse("2025-11-15T08:00:00Z"),  // 出勤前
            OffsetDateTime.parse("2025-11-15T08:30:00Z"),
            false,
            "休憩が勤務時間外のリクエストです。"
        );

        // When & Then
        assertThatThrownBy(() -> service.createRequest(request, 100))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("休憩時間は出勤時刻と退勤時刻の間");
    }

    @Test
    void createRequest_失敗_休憩が勤務時間外_退勤後() {
        // Given
        StampRequestCreateRequest request = new StampRequestCreateRequest(
            1,
            OffsetDateTime.parse("2025-11-15T09:00:00Z"),
            OffsetDateTime.parse("2025-11-15T18:00:00Z"),
            OffsetDateTime.parse("2025-11-15T18:30:00Z"),  // 退勤後
            OffsetDateTime.parse("2025-11-15T19:00:00Z"),
            false,
            "休憩が勤務時間外のリクエストです。"
        );

        // When & Then
        assertThatThrownBy(() -> service.createRequest(request, 100))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("休憩時間は出勤時刻と退勤時刻の間");
    }

    @Test
    void createRequest_失敗_休憩開始のみ指定() {
        // Given - 休憩開始だけ指定、終了がnull
        StampRequestCreateRequest request = new StampRequestCreateRequest(
            1,
            OffsetDateTime.parse("2025-11-15T09:00:00Z"),
            OffsetDateTime.parse("2025-11-15T18:00:00Z"),
            OffsetDateTime.parse("2025-11-15T12:00:00Z"),
            null,  // 終了時刻がnull
            false,
            "休憩開始のみ指定したリクエストです。"
        );

        // When & Then
        assertThatThrownBy(() -> service.createRequest(request, 100))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("休憩時間は開始と終了の両方を指定する必要があります");
    }

    @Test
    void createRequest_失敗_休憩終了のみ指定() {
        // Given - 休憩終了だけ指定、開始がnull
        StampRequestCreateRequest request = new StampRequestCreateRequest(
            1,
            OffsetDateTime.parse("2025-11-15T09:00:00Z"),
            OffsetDateTime.parse("2025-11-15T18:00:00Z"),
            null,  // 開始時刻がnull
            OffsetDateTime.parse("2025-11-15T13:00:00Z"),
            false,
            "休憩終了のみ指定したリクエストです。"
        );

        // When & Then
        assertThatThrownBy(() -> service.createRequest(request, 100))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("休憩時間は開始と終了の両方を指定する必要があります");
    }

    @Test
    void createRequest_失敗_同じstampHistoryに対して既にPENDINGリクエストが存在() {
        // Given - 最初のリクエストを作成
        StampRequestCreateRequest firstRequest = new StampRequestCreateRequest(
            1,
            OffsetDateTime.parse("2025-11-15T09:00:00Z"),
            OffsetDateTime.parse("2025-11-15T18:00:00Z"),
            null,
            null,
            false,
            "最初のリクエストです。十分な長さがあります。"
        );
        service.createRequest(firstRequest, 100);

        // 同じstampHistoryIdで2つ目のリクエスト
        StampRequestCreateRequest duplicateRequest = new StampRequestCreateRequest(
            1,  // 同じstampHistoryId
            OffsetDateTime.parse("2025-11-15T09:30:00Z"),
            OffsetDateTime.parse("2025-11-15T18:30:00Z"),
            null,
            null,
            false,
            "2つ目のリクエストです。十分な長さがあります。"
        );

        // When & Then
        assertThatThrownBy(() -> service.createRequest(duplicateRequest, 100))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("この勤怠記録に対して既に申請中のリクエストが存在します");
    }

    @Test
    void createRequest_成功_異なる社員の同じstampHistory() {
        // Given - 社員100がstampHistory=1にリクエスト
        StampRequestCreateRequest request100 = new StampRequestCreateRequest(
            1,
            OffsetDateTime.parse("2025-11-15T09:00:00Z"),
            OffsetDateTime.parse("2025-11-15T18:00:00Z"),
            null,
            null,
            false,
            "社員100のリクエストです。十分な長さがあります。"
        );
        service.createRequest(request100, 100);

        // 社員200も同じstampHistory=1にリクエスト（別の社員なので許可されるべき）
        StampRequestCreateRequest request200 = new StampRequestCreateRequest(
            1,  // 同じstampHistoryId
            OffsetDateTime.parse("2025-11-15T09:30:00Z"),
            OffsetDateTime.parse("2025-11-15T18:30:00Z"),
            null,
            null,
            false,
            "社員200のリクエストです。十分な長さがあります。"
        );

        // When
        stubStampHistory(1, 200);
        StampRequest result = service.createRequest(request200, 200);

        // Then - 異なる社員なので成功すべき
        assertThat(result).isNotNull();
        assertThat(result.getEmployeeId()).isEqualTo(200);
        assertThat(result.getStampHistoryId()).isEqualTo(1);
    }

    @Test
    void createRequest_成功_同じstampHistoryにCANCELLEDリクエストが存在() {
        // Given - PENDING状態でリクエストを作成
        StampRequestCreateRequest firstRequest = new StampRequestCreateRequest(
            1,
            OffsetDateTime.parse("2025-11-15T09:00:00Z"),
            OffsetDateTime.parse("2025-11-15T18:00:00Z"),
            null,
            null,
            false,
            "最初のリクエストです。十分な長さがあります。"
        );
        stubStampHistory(1, 100);
        StampRequest cancelledRequest = service.createRequest(firstRequest, 100);

        // 手動でCANCELLED状態に変更
        cancelledRequest.setStatus(StampRequestStatus.CANCELLED.name());
        store.save(cancelledRequest);

        // 同じstampHistoryIdで新規リクエスト
        StampRequestCreateRequest newRequest = new StampRequestCreateRequest(
            1,  // 同じstampHistoryId
            OffsetDateTime.parse("2025-11-15T09:30:00Z"),
            OffsetDateTime.parse("2025-11-15T18:30:00Z"),
            null,
            null,
            false,
            "新しいリクエストです。十分な長さがあります。"
        );

        // When - CANCELLED状態のリクエストがあっても新規作成は可能
        stubStampHistory(1, 100);
        StampRequest result = service.createRequest(newRequest, 100);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getStampHistoryId()).isEqualTo(1);
        assertThat(result.getStatus()).isEqualTo(StampRequestStatus.PENDING.name());
    }

    @Test
    void createRequest_成功_翌日退勤の調整() {
        // Given - 退勤時刻が翌日（日付を跨ぐ深夜勤務）
        // 現在時刻（10:00）より前の時刻を使用
        OffsetDateTime inTime = OffsetDateTime.parse("2025-11-14T22:00:00Z");  // 前日22:00
        OffsetDateTime outTime = OffsetDateTime.parse("2025-11-15T02:00:00Z");  // 翌日02:00

        StampRequestCreateRequest request = new StampRequestCreateRequest(
            1,
            inTime,
            outTime,
            null,
            null,
            true,  // 夜勤フラグ
            "深夜勤務のため翌日退勤となります。"
        );

        // When
        StampRequest result = service.createRequest(request, 100);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getRequestedInTime()).isEqualTo(inTime);
        assertThat(result.getRequestedOutTime()).isEqualTo(outTime);
        assertThat(result.getRequestedIsNightShift()).isTrue();
        assertThat(result.getStampDate()).isEqualTo(inTime.toLocalDate());
    }

    private void stubStampHistory(int stampHistoryId, int employeeId) {
        OffsetDateTime defaultIn = OffsetDateTime.parse("2025-11-15T08:00:00Z");
        OffsetDateTime defaultOut = OffsetDateTime.parse("2025-11-15T17:00:00Z");
        StampHistory history = new StampHistory(
            stampHistoryId,
            "2025",
            "11",
            "15",
            defaultIn.toLocalDate(),
            employeeId,
            defaultIn,
            defaultOut,
            null,
            null,
            false,
            employeeId,
            defaultOut
        );
        historyStub.put(stampHistoryId, history);
    }
}
