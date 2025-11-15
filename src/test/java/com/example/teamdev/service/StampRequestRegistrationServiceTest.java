package com.example.teamdev.service;

import com.example.teamdev.constant.StampRequestStatus;
import com.example.teamdev.dto.api.stamprequest.StampRequestCreateRequest;
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

    @BeforeEach
    void setUp() {
        // 2025-11-15 10:00:00 UTC に固定
        fixedClock = Clock.fixed(
            Instant.parse("2025-11-15T10:00:00Z"),
            ZoneId.of("UTC")
        );
        store = new StampRequestStore(fixedClock);
        service = new StampRequestRegistrationService(store);
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
    void createRequest_失敗_理由が短すぎる() {
        // Given
        StampRequestCreateRequest request = new StampRequestCreateRequest(
            1,
            OffsetDateTime.parse("2025-11-15T09:00:00Z"),
            OffsetDateTime.parse("2025-11-15T18:00:00Z"),
            null,
            null,
            false,
            "短い"  // 10文字未満
        );

        // When & Then
        assertThatThrownBy(() -> service.createRequest(request, 100))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("理由は10文字以上");
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
            OffsetDateTime.parse("2025-11-15T18:00:00Z"),
            OffsetDateTime.parse("2025-11-15T09:00:00Z"),  // 出勤より前
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
    void createRequest_成功_翌日退勤の調整() {
        // Given - 退勤時刻が翌日（日付を跨ぐ深夜勤務）
        OffsetDateTime inTime = OffsetDateTime.parse("2025-11-15T22:00:00Z");
        OffsetDateTime outTime = OffsetDateTime.parse("2025-11-16T02:00:00Z");  // 翌日

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
}
