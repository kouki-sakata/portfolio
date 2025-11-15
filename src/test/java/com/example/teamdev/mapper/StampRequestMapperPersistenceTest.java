package com.example.teamdev.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.teamdev.entity.StampRequest;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class StampRequestMapperPersistenceTest extends StampRequestMapperTestBase {

    @Test
    @DisplayName("save - リクエストを保存してIDが自動生成される")
    void save_generatesId() {
        int employeeId = insertEmployee(1001, "Test", "Employee");
        int stampHistoryId = insertStampHistory(employeeId, LocalDate.of(2025, 11, 15));

        StampRequest request = StampRequest.builder()
                .employeeId(employeeId)
                .stampHistoryId(stampHistoryId)
                .stampDate(LocalDate.of(2025, 11, 15))
                .status("PENDING")
                .requestedInTime(OffsetDateTime.of(2025, 11, 15, 9, 0, 0, 0, JST))
                .requestedOutTime(OffsetDateTime.of(2025, 11, 15, 18, 0, 0, 0, JST))
                .requestedIsNightShift(false)
                .reason("打刻忘れのため修正をお願いします。")
                .createdAt(OffsetDateTime.now(JST))
                .updatedAt(OffsetDateTime.now(JST))
                .build();

        stampRequestMapper.save(request);

        assertThat(request.getId()).isNotNull();
        assertThat(request.getId()).isGreaterThan(0);
    }

    @Test
    @DisplayName("findById - IDでリクエストを取得できる")
    void findById_returnsRequest() {
        int employeeId = insertEmployee(1002, "Find", "ById");
        int stampHistoryId = insertStampHistory(employeeId, LocalDate.of(2025, 11, 16));

        int requestId = insertStampRequest(
                employeeId,
                stampHistoryId,
                LocalDate.of(2025, 11, 16),
                "PENDING",
                "IDで取得するテストです。"
        );

        Optional<StampRequest> result = stampRequestMapper.findById(requestId);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(requestId);
        assertThat(result.get().getEmployeeId()).isEqualTo(employeeId);
        assertThat(result.get().getStatus()).isEqualTo("PENDING");
        assertThat(result.get().getReason()).isEqualTo("IDで取得するテストです。");
    }

    @Test
    @DisplayName("findById - 存在しないIDの場合はEmptyを返す")
    void findById_nonExistent_returnsEmpty() {
        Optional<StampRequest> result = stampRequestMapper.findById(999999);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("findByEmployeeId - 従業員IDでリクエストを取得できる（作成日降順）")
    void findByEmployeeId_returnsRequestsInDescOrder() {
        int employeeId = insertEmployee(1003, "Find", "Employee");
        int stampHistoryId1 = insertStampHistory(employeeId, LocalDate.of(2025, 11, 1));
        int stampHistoryId2 = insertStampHistory(employeeId, LocalDate.of(2025, 11, 2));

        // 古いリクエスト
        int oldRequestId = insertStampRequest(
                employeeId,
                stampHistoryId1,
                LocalDate.of(2025, 11, 1),
                "APPROVED",
                "古いリクエストです。"
        );

        // 新しいリクエスト
        int newRequestId = insertStampRequest(
                employeeId,
                stampHistoryId2,
                LocalDate.of(2025, 11, 2),
                "PENDING",
                "新しいリクエストです。"
        );

        List<StampRequest> results = stampRequestMapper.findByEmployeeId(employeeId);

        assertThat(results).hasSize(2);
        assertThat(results.get(0).getId()).isEqualTo(newRequestId); // 新しい方が先
        assertThat(results.get(1).getId()).isEqualTo(oldRequestId);
    }

    @Test
    @DisplayName("findByEmployeeIdAndStatus - 従業員ID + ステータスで絞り込める")
    void findByEmployeeIdAndStatus_filtersCorrectly() {
        int employeeId = insertEmployee(1004, "Filter", "Status");
        int stampHistoryId1 = insertStampHistory(employeeId, LocalDate.of(2025, 11, 1));
        int stampHistoryId2 = insertStampHistory(employeeId, LocalDate.of(2025, 11, 2));
        int stampHistoryId3 = insertStampHistory(employeeId, LocalDate.of(2025, 11, 3));

        String pendingReason1 = "PENDING1 request";
        String pendingReason2 = "PENDING2 request";

        insertStampRequest(employeeId, stampHistoryId1, LocalDate.of(2025, 11, 1), "PENDING", pendingReason1);
        insertStampRequest(employeeId, stampHistoryId2, LocalDate.of(2025, 11, 2), "APPROVED", "APPROVED1 request");
        insertStampRequest(employeeId, stampHistoryId3, LocalDate.of(2025, 11, 3), "PENDING", pendingReason2);

        List<StampRequest> pendingRequests = stampRequestMapper.findByEmployeeIdAndStatus(employeeId, "PENDING");

        assertThat(pendingRequests).hasSize(2);
        assertThat(pendingRequests)
                .extracting(StampRequest::getReason)
                .containsExactly(pendingReason2, pendingReason1); // 作成日降順
    }

    @Test
    @DisplayName("findPendingByEmployeeIdAndStampHistoryId - PENDING状態のリクエストを取得できる")
    void findPendingByEmployeeIdAndStampHistoryId_returnsPendingRequest() {
        int employeeId = insertEmployee(1005, "Pending", "Check");
        int stampHistoryId = insertStampHistory(employeeId, LocalDate.of(2025, 11, 15));

        insertStampRequest(employeeId, stampHistoryId, LocalDate.of(2025, 11, 15), "PENDING", "PENDING request");

        Optional<StampRequest> result = stampRequestMapper.findPendingByEmployeeIdAndStampHistoryId(
                employeeId,
                stampHistoryId
        );

        assertThat(result).isPresent();
        assertThat(result.get().getStatus()).isEqualTo("PENDING");
    }

    @Test
    @DisplayName("findPendingByEmployeeIdAndStampHistoryId - APPROVEDの場合は取得できない")
    void findPendingByEmployeeIdAndStampHistoryId_approvedRequest_returnsEmpty() {
        int employeeId = insertEmployee(1006, "Approved", "Check");
        int stampHistoryId = insertStampHistory(employeeId, LocalDate.of(2025, 11, 15));

        insertStampRequest(employeeId, stampHistoryId, LocalDate.of(2025, 11, 15), "APPROVED", "APPROVED request");

        Optional<StampRequest> result = stampRequestMapper.findPendingByEmployeeIdAndStampHistoryId(
                employeeId,
                stampHistoryId
        );

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("findByStatus - ステータスで取得できる")
    void findByStatus_returnsRequestsByStatus() {
        int employee1 = insertEmployee(1007, "Status", "One");
        int employee2 = insertEmployee(1008, "Status", "Two");
        int stampHistory1 = insertStampHistory(employee1, LocalDate.of(2025, 11, 1));
        int stampHistory2 = insertStampHistory(employee2, LocalDate.of(2025, 11, 2));

        insertStampRequest(employee1, stampHistory1, LocalDate.of(2025, 11, 1), "PENDING", "PENDING1");
        insertStampRequest(employee2, stampHistory2, LocalDate.of(2025, 11, 2), "PENDING", "PENDING2");

        List<StampRequest> pendingRequests = stampRequestMapper.findByStatus("PENDING");

        assertThat(pendingRequests).hasSizeGreaterThanOrEqualTo(2);
        assertThat(pendingRequests)
                .extracting(StampRequest::getStatus)
                .containsOnly("PENDING");
    }

    @Test
    @DisplayName("findByStatusWithPagination - ページネーションが機能する")
    void findByStatusWithPagination_worksCorrectly() {
        int employeeId = insertEmployee(1009, "Pagination", "Test");

        for (int i = 1; i <= 5; i++) {
            int stampHistoryId = insertStampHistory(employeeId, LocalDate.of(2025, 11, i));
            insertStampRequest(
                    employeeId,
                    stampHistoryId,
                    LocalDate.of(2025, 11, i),
                    "PENDING",
                    "Request " + i
            );
        }

        List<StampRequest> page1 = stampRequestMapper.findByStatusWithPagination("PENDING", 0, 3);
        List<StampRequest> page2 = stampRequestMapper.findByStatusWithPagination("PENDING", 3, 3);

        assertThat(page1).hasSizeGreaterThanOrEqualTo(3);
        assertThat(page2).isNotEmpty();
    }

    @Test
    @DisplayName("countByStatus - ステータス別のカウントが正しい")
    void countByStatus_returnsCorrectCount() {
        int employeeId = insertEmployee(1010, "Count", "Test");

        for (int i = 1; i <= 3; i++) {
            int stampHistoryId = insertStampHistory(employeeId, LocalDate.of(2025, 11, i));
            insertStampRequest(
                    employeeId,
                    stampHistoryId,
                    LocalDate.of(2025, 11, i),
                    "PENDING",
                    "Count request " + i
            );
        }

        int count = stampRequestMapper.countByStatus("PENDING");

        assertThat(count).isGreaterThanOrEqualTo(3);
    }

    @Test
    @DisplayName("findLatestByStampHistoryId - 最新のリクエストを取得できる")
    void findLatestByStampHistoryId_returnsLatestRequest() {
        int employeeId = insertEmployee(1011, "Latest", "Test");
        int stampHistoryId = insertStampHistory(employeeId, LocalDate.of(2025, 11, 15));

        insertStampRequest(employeeId, stampHistoryId, LocalDate.of(2025, 11, 15), "CANCELLED", "Old request");
        int latestId = insertStampRequest(employeeId, stampHistoryId, LocalDate.of(2025, 11, 15), "PENDING", "Latest request");

        Optional<StampRequest> result = stampRequestMapper.findLatestByStampHistoryId(stampHistoryId);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(latestId);
        assertThat(result.get().getReason()).isEqualTo("Latest request");
    }

    @Test
    @DisplayName("update - リクエストを更新できる")
    void update_updatesRequest() {
        int employeeId = insertEmployee(1012, "Update", "Test");
        int stampHistoryId = insertStampHistory(employeeId, LocalDate.of(2025, 11, 15));

        int requestId = insertStampRequest(
                employeeId,
                stampHistoryId,
                LocalDate.of(2025, 11, 15),
                "PENDING",
                "更新前のリクエストです。"
        );

        StampRequest request = stampRequestMapper.findById(requestId).orElseThrow();
        request.setStatus("APPROVED");
        request.setApprovalNote("承認しました。");
        request.setApprovalEmployeeId(employeeId);
        request.setApprovedAt(OffsetDateTime.now(JST));
        request.setUpdatedAt(OffsetDateTime.now(JST));

        stampRequestMapper.update(request);

        StampRequest updated = stampRequestMapper.findById(requestId).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo("APPROVED");
        assertThat(updated.getApprovalNote()).isEqualTo("承認しました。");
        assertThat(updated.getApprovalEmployeeId()).isEqualTo(employeeId);
        assertThat(updated.getApprovedAt()).isNotNull();
    }

    @Test
    @DisplayName("deleteById - リクエストを削除できる")
    void deleteById_deletesRequest() {
        int employeeId = insertEmployee(1013, "Delete", "Test");
        int stampHistoryId = insertStampHistory(employeeId, LocalDate.of(2025, 11, 15));

        int requestId = insertStampRequest(
                employeeId,
                stampHistoryId,
                LocalDate.of(2025, 11, 15),
                "PENDING",
                "削除するリクエストです。"
        );

        int deletedCount = stampRequestMapper.deleteById(requestId);

        assertThat(deletedCount).isEqualTo(1);
        assertThat(stampRequestMapper.findById(requestId)).isEmpty();
    }

}
