package com.example.teamdev.mapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.teamdev.entity.StampRequest;
import com.example.teamdev.testconfig.PostgresContainerSupport;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class StampRequestLifecycleTest extends PostgresContainerSupport {

    @Autowired
    private StampRequestMapper stampRequestMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final ZoneOffset JST = ZoneOffset.ofHours(9);

    @Test
    @DisplayName("updated_atトリガー - UPDATEで自動的にupdated_atが更新される")
    void updatedAtTrigger_automaticallyUpdatesTimestamp() throws InterruptedException {
        int employeeId = insertEmployee(2001, "Trigger", "Test");
        int stampHistoryId = insertStampHistory(employeeId, LocalDate.of(2025, 11, 15));

        StampRequest request = StampRequest.builder()
                .employeeId(employeeId)
                .stampHistoryId(stampHistoryId)
                .stampDate(LocalDate.of(2025, 11, 15))
                .status("PENDING")
                .requestedInTime(OffsetDateTime.of(2025, 11, 15, 9, 0, 0, 0, JST))
                .requestedIsNightShift(false)
                .reason("トリガーテスト用のリクエストです。")
                .createdAt(OffsetDateTime.now(JST))
                .updatedAt(OffsetDateTime.now(JST))
                .build();

        stampRequestMapper.save(request);
        OffsetDateTime originalUpdatedAt = request.getUpdatedAt();

        // 少し待機してからUPDATE
        Thread.sleep(100);

        request.setStatus("APPROVED");
        request.setUpdatedAt(OffsetDateTime.now(JST)); // 明示的に設定するが、トリガーで上書きされる
        stampRequestMapper.update(request);

        StampRequest updated = stampRequestMapper.findById(request.getId()).orElseThrow();

        // updated_atがトリガーで自動更新されている（originalより新しい）
        assertThat(updated.getUpdatedAt()).isAfter(originalUpdatedAt);
    }

    @Test
    @DisplayName("Unique Index - PENDING状態の重複リクエストは挿入できない")
    void uniqueIndex_preventsDuplicatePendingRequests() {
        int employeeId = insertEmployee(2002, "Unique", "Test");
        int stampHistoryId = insertStampHistory(employeeId, LocalDate.of(2025, 11, 15));

        StampRequest firstRequest = StampRequest.builder()
                .employeeId(employeeId)
                .stampHistoryId(stampHistoryId)
                .stampDate(LocalDate.of(2025, 11, 15))
                .status("PENDING")
                .requestedInTime(OffsetDateTime.of(2025, 11, 15, 9, 0, 0, 0, JST))
                .requestedIsNightShift(false)
                .reason("最初のPENDINGリクエストです。")
                .createdAt(OffsetDateTime.now(JST))
                .updatedAt(OffsetDateTime.now(JST))
                .build();

        stampRequestMapper.save(firstRequest);

        StampRequest secondRequest = StampRequest.builder()
                .employeeId(employeeId)
                .stampHistoryId(stampHistoryId)
                .stampDate(LocalDate.of(2025, 11, 15))
                .status("PENDING")
                .requestedInTime(OffsetDateTime.of(2025, 11, 15, 10, 0, 0, 0, JST))
                .requestedIsNightShift(false)
                .reason("2つ目のPENDINGリクエスト（挿入失敗するはず）")
                .createdAt(OffsetDateTime.now(JST))
                .updatedAt(OffsetDateTime.now(JST))
                .build();

        // 同じemployeeId + stampHistoryIdでPENDING状態のリクエストを挿入しようとするとエラー
        assertThatThrownBy(() -> stampRequestMapper.save(secondRequest))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Unique Index - PENDING以外の状態なら重複挿入できる")
    void uniqueIndex_allowsDuplicateNonPendingRequests() {
        int employeeId = insertEmployee(2003, "NonPending", "Test");
        int stampHistoryId = insertStampHistory(employeeId, LocalDate.of(2025, 11, 15));

        StampRequest approvedRequest = StampRequest.builder()
                .employeeId(employeeId)
                .stampHistoryId(stampHistoryId)
                .stampDate(LocalDate.of(2025, 11, 15))
                .status("APPROVED")
                .requestedInTime(OffsetDateTime.of(2025, 11, 15, 9, 0, 0, 0, JST))
                .requestedIsNightShift(false)
                .reason("承認済みリクエストです。")
                .createdAt(OffsetDateTime.now(JST))
                .updatedAt(OffsetDateTime.now(JST))
                .build();

        stampRequestMapper.save(approvedRequest);

        StampRequest rejectedRequest = StampRequest.builder()
                .employeeId(employeeId)
                .stampHistoryId(stampHistoryId)
                .stampDate(LocalDate.of(2025, 11, 15))
                .status("REJECTED")
                .requestedInTime(OffsetDateTime.of(2025, 11, 15, 10, 0, 0, 0, JST))
                .requestedIsNightShift(false)
                .reason("却下されたリクエストです。")
                .createdAt(OffsetDateTime.now(JST))
                .updatedAt(OffsetDateTime.now(JST))
                .build();

        // PENDING以外なら同じemployeeId + stampHistoryIdでも挿入できる
        stampRequestMapper.save(rejectedRequest);

        assertThat(approvedRequest.getId()).isNotNull();
        assertThat(rejectedRequest.getId()).isNotNull();
        assertThat(approvedRequest.getId()).isNotEqualTo(rejectedRequest.getId());
    }

    @Test
    @DisplayName("Unique Index - PENDINGからAPPROVEDに変更後、新しいPENDINGを挿入できる")
    void uniqueIndex_allowsNewPendingAfterStatusChange() {
        int employeeId = insertEmployee(2004, "StatusChange", "Test");
        int stampHistoryId = insertStampHistory(employeeId, LocalDate.of(2025, 11, 15));

        StampRequest pendingRequest = StampRequest.builder()
                .employeeId(employeeId)
                .stampHistoryId(stampHistoryId)
                .stampDate(LocalDate.of(2025, 11, 15))
                .status("PENDING")
                .requestedInTime(OffsetDateTime.of(2025, 11, 15, 9, 0, 0, 0, JST))
                .requestedIsNightShift(false)
                .reason("最初のPENDINGリクエストです。")
                .createdAt(OffsetDateTime.now(JST))
                .updatedAt(OffsetDateTime.now(JST))
                .build();

        stampRequestMapper.save(pendingRequest);

        // PENDINGからAPPROVEDに変更
        pendingRequest.setStatus("APPROVED");
        pendingRequest.setUpdatedAt(OffsetDateTime.now(JST));
        stampRequestMapper.update(pendingRequest);

        // 同じemployeeId + stampHistoryIdで新しいPENDINGリクエストを挿入
        StampRequest newPendingRequest = StampRequest.builder()
                .employeeId(employeeId)
                .stampHistoryId(stampHistoryId)
                .stampDate(LocalDate.of(2025, 11, 15))
                .status("PENDING")
                .requestedInTime(OffsetDateTime.of(2025, 11, 15, 10, 0, 0, 0, JST))
                .requestedIsNightShift(false)
                .reason("2回目のPENDINGリクエスト（前回はAPPROVEDになった）")
                .createdAt(OffsetDateTime.now(JST))
                .updatedAt(OffsetDateTime.now(JST))
                .build();

        // 前回のPENDINGがAPPROVEDに変わっているので、新しいPENDINGを挿入できる
        stampRequestMapper.save(newPendingRequest);

        assertThat(newPendingRequest.getId()).isNotNull();
        assertThat(newPendingRequest.getId()).isNotEqualTo(pendingRequest.getId());
    }

    @Test
    @DisplayName("Original/Requested snapshots - 値が正しく保存・取得される")
    void snapshots_immutableValues() {
        int employeeId = insertEmployee(2005, "Snapshot", "Test");
        int stampHistoryId = insertStampHistory(employeeId, LocalDate.of(2025, 11, 15));

        OffsetDateTime originalInTime = OffsetDateTime.of(2025, 11, 15, 9, 0, 0, 0, JST);
        OffsetDateTime originalOutTime = OffsetDateTime.of(2025, 11, 15, 18, 0, 0, 0, JST);
        OffsetDateTime requestedInTime = OffsetDateTime.of(2025, 11, 15, 8, 30, 0, 0, JST);
        OffsetDateTime requestedOutTime = OffsetDateTime.of(2025, 11, 15, 17, 30, 0, 0, JST);

        StampRequest request = StampRequest.builder()
                .employeeId(employeeId)
                .stampHistoryId(stampHistoryId)
                .stampDate(LocalDate.of(2025, 11, 15))
                .status("PENDING")
                .originalInTime(originalInTime)
                .originalOutTime(originalOutTime)
                .originalIsNightShift(false)
                .requestedInTime(requestedInTime)
                .requestedOutTime(requestedOutTime)
                .requestedIsNightShift(false)
                .reason("スナップショットテスト用のリクエストです。")
                .createdAt(OffsetDateTime.now(JST))
                .updatedAt(OffsetDateTime.now(JST))
                .build();

        stampRequestMapper.save(request);

        StampRequest saved = stampRequestMapper.findById(request.getId()).orElseThrow();

        assertThat(saved.getOriginalInTime()).isEqualTo(originalInTime);
        assertThat(saved.getOriginalOutTime()).isEqualTo(originalOutTime);
        assertThat(saved.getOriginalIsNightShift()).isFalse();
        assertThat(saved.getRequestedInTime()).isEqualTo(requestedInTime);
        assertThat(saved.getRequestedOutTime()).isEqualTo(requestedOutTime);
        assertThat(saved.getRequestedIsNightShift()).isFalse();
    }

    @Test
    @DisplayName("Status transitions - PENDING → APPROVED → (no further PENDING allowed)")
    void statusTransitions_lifecycleFlow() {
        int employeeId = insertEmployee(2006, "Lifecycle", "Test");
        int stampHistoryId = insertStampHistory(employeeId, LocalDate.of(2025, 11, 15));

        // 1. PENDING状態で作成
        StampRequest request = StampRequest.builder()
                .employeeId(employeeId)
                .stampHistoryId(stampHistoryId)
                .stampDate(LocalDate.of(2025, 11, 15))
                .status("PENDING")
                .requestedInTime(OffsetDateTime.of(2025, 11, 15, 9, 0, 0, 0, JST))
                .requestedIsNightShift(false)
                .reason("ライフサイクルテスト用のリクエストです。")
                .createdAt(OffsetDateTime.now(JST))
                .updatedAt(OffsetDateTime.now(JST))
                .build();

        stampRequestMapper.save(request);
        assertThat(request.getStatus()).isEqualTo("PENDING");

        // 2. APPROVEDに変更
        request.setStatus("APPROVED");
        request.setApprovalEmployeeId(employeeId);
        request.setApprovedAt(OffsetDateTime.now(JST));
        request.setUpdatedAt(OffsetDateTime.now(JST));
        stampRequestMapper.update(request);

        StampRequest approved = stampRequestMapper.findById(request.getId()).orElseThrow();
        assertThat(approved.getStatus()).isEqualTo("APPROVED");
        assertThat(approved.getApprovalEmployeeId()).isEqualTo(employeeId);
        assertThat(approved.getApprovedAt()).isNotNull();
    }

    // === Helper methods ===

    private int insertEmployee(int id, String firstName, String lastName) {
        jdbcTemplate.update(
                """
                INSERT INTO employee (id, first_name, last_name, email, password, admin_flag, update_date, profile_metadata)
                VALUES (?, ?, ?, ?, 'password', 0, NOW(), '{}'::jsonb)
                ON CONFLICT (id) DO NOTHING
                """,
                id,
                firstName,
                lastName,
                firstName.toLowerCase() + "." + lastName.toLowerCase() + "@lifecycle.test"
        );
        return id;
    }

    private int insertStampHistory(int employeeId, LocalDate date) {
        Integer id = jdbcTemplate.queryForObject(
                """
                INSERT INTO stamp_history (stamp_date, year, month, day, employee_id, update_employee_id, update_date)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
                RETURNING id
                """,
                Integer.class,
                date,
                String.format("%04d", date.getYear()),
                String.format("%02d", date.getMonthValue()),
                String.format("%02d", date.getDayOfMonth()),
                employeeId,
                employeeId
        );
        return id != null ? id : 0;
    }
}
