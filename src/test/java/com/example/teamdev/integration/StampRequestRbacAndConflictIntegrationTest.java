package com.example.teamdev.integration;

import com.example.teamdev.testconfig.PostgresContainerSupport;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for RBAC (Role-Based Access Control) and conflict handling.
 *
 * Validates:
 * - Only authenticated users can access endpoints
 * - Admins can access admin-only endpoints
 * - Employees cannot access admin endpoints (403)
 * - Conflict detection when stamp history is modified
 * - Duplicate prevention
 *
 * Requirements: 1, 2, 3, 4, 6, 7, 8, 9
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("integration")
@Transactional
class StampRequestRbacAndConflictIntegrationTest extends PostgresContainerSupport {

    private static final String EMPLOYEE_EMAIL = "employee@example.com";
    private static final String EMPLOYEE_PASSWORD = "EmployeePass123!";
    private static final String ADMIN_EMAIL = "admin@example.com";
    private static final String ADMIN_PASSWORD = "AdminPass123!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private Integer employeeId;
    private Integer adminId;
    private Integer stampHistoryId;

    @BeforeEach
    void setUp() {
        employeeId = ensureAccount("テスト", "社員", EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD, false);
        adminId = ensureAccount("テスト", "管理者", ADMIN_EMAIL, ADMIN_PASSWORD, true);
        stampHistoryId = createStampHistory(employeeId, LocalDate.now().minusDays(1));
    }

    // ========== RBAC Tests ==========

    @DisplayName("RBAC: Unauthenticated user cannot create request (401)")
    @Test
    void unauthenticatedUserCannotCreateRequest() throws Exception {
        String createRequestJson = """
            {
                "stampHistoryId": %d,
                "requestedInTime": "2025-11-14T09:00:00+09:00",
                "requestedOutTime": "2025-11-14T18:00:00+09:00",
                "reason": "出勤時刻の修正が必要です。十分な長さです。"
            }
            """.formatted(stampHistoryId);

        mockMvc.perform(post("/api/stamp-requests")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(createRequestJson))
            .andExpect(status().isUnauthorized());
    }

    @DisplayName("RBAC: Unauthenticated user cannot view My Requests (401)")
    @Test
    void unauthenticatedUserCannotViewMyRequests() throws Exception {
        mockMvc.perform(get("/api/stamp-requests/my-requests"))
            .andExpect(status().isUnauthorized());
    }

    @DisplayName("RBAC: Employee cannot access pending requests endpoint (403)")
    @Test
    void employeeCannotAccessPendingRequests() throws Exception {
        MockHttpSession employeeSession = loginAs(EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD);

        mockMvc.perform(get("/api/stamp-requests/pending")
                .session(employeeSession))
            .andExpect(status().isForbidden());
    }

    @DisplayName("RBAC: Employee cannot approve requests (403)")
    @Test
    void employeeCannotApproveRequests() throws Exception {
        // Create a request first
        MockHttpSession employeeSession = loginAs(EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD);
        Integer requestId = createTestRequest(employeeSession);

        // Try to approve it (should fail)
        String approveJson = """
            {
                "approvalNote": "社員による承認試行"
            }
            """;

        mockMvc.perform(post("/api/stamp-requests/{id}/approve", requestId)
                .session(employeeSession)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(approveJson))
            .andExpect(status().isForbidden());
    }

    @DisplayName("RBAC: Employee cannot reject requests (403)")
    @Test
    void employeeCannotRejectRequests() throws Exception {
        // Create a request first
        MockHttpSession employeeSession = loginAs(EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD);
        Integer requestId = createTestRequest(employeeSession);

        // Try to reject it (should fail)
        String rejectJson = """
            {
                "rejectionReason": "社員による却下試行です。十分な長さです。"
            }
            """;

        mockMvc.perform(post("/api/stamp-requests/{id}/reject", requestId)
                .session(employeeSession)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(rejectJson))
            .andExpect(status().isForbidden());
    }

    @DisplayName("RBAC: Employee cannot perform bulk operations (403)")
    @Test
    void employeeCannotPerformBulkOperations() throws Exception {
        MockHttpSession employeeSession = loginAs(EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD);
        Integer requestId = createTestRequest(employeeSession);

        String bulkApproveJson = """
            {
                "requestIds": [%d],
                "approvalNote": "一括承認試行"
            }
            """.formatted(requestId);

        mockMvc.perform(post("/api/stamp-requests/bulk/approve")
                .session(employeeSession)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(bulkApproveJson))
            .andExpect(status().isForbidden());
    }

    @DisplayName("RBAC: Admin can access pending requests")
    @Test
    void adminCanAccessPendingRequests() throws Exception {
        MockHttpSession adminSession = loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);

        mockMvc.perform(get("/api/stamp-requests/pending")
                .session(adminSession))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.requests").isArray());
    }

    @DisplayName("RBAC: Admin can approve requests")
    @Test
    void adminCanApproveRequests() throws Exception {
        // Create request as employee
        MockHttpSession employeeSession = loginAs(EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD);
        Integer requestId = createTestRequest(employeeSession);

        // Approve as admin
        MockHttpSession adminSession = loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
        String approveJson = """
            {
                "approvalNote": "承認しました"
            }
            """;

        mockMvc.perform(post("/api/stamp-requests/{id}/approve", requestId)
                .session(adminSession)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(approveJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    // ========== Conflict Handling Tests ==========

    @DisplayName("Conflict: Cannot approve if stamp history was modified")
    @Test
    void cannotApproveIfStampHistoryModified() throws Exception {
        // Create request
        MockHttpSession employeeSession = loginAs(EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD);
        Integer requestId = createTestRequest(employeeSession);

        // Modify stamp history directly (simulating concurrent modification)
        jdbcTemplate.update(
            "UPDATE stamp_history SET in_time = ? WHERE id = ?",
            OffsetDateTime.parse("2025-11-14T10:00:00+09:00"),
            stampHistoryId
        );

        // Try to approve (should detect conflict)
        MockHttpSession adminSession = loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
        String approveJson = """
            {
                "approvalNote": "承認します"
            }
            """;

        mockMvc.perform(post("/api/stamp-requests/{id}/approve", requestId)
                .session(adminSession)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(approveJson))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value(containsString("既に変更されています")));
    }

    @DisplayName("Conflict: Cannot submit duplicate PENDING request for same stamp history")
    @Test
    void cannotSubmitDuplicatePendingRequest() throws Exception {
        MockHttpSession employeeSession = loginAs(EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD);

        // Create first request
        String createRequestJson = """
            {
                "stampHistoryId": %d,
                "requestedInTime": "2025-11-14T09:00:00+09:00",
                "requestedOutTime": "2025-11-14T18:00:00+09:00",
                "reason": "最初のリクエストです。十分な長さがあります。"
            }
            """.formatted(stampHistoryId);

        mockMvc.perform(post("/api/stamp-requests")
                .session(employeeSession)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(createRequestJson))
            .andExpect(status().isCreated());

        // Try to create duplicate request (should fail)
        String duplicateRequestJson = """
            {
                "stampHistoryId": %d,
                "requestedInTime": "2025-11-14T09:30:00+09:00",
                "requestedOutTime": "2025-11-14T18:30:00+09:00",
                "reason": "2つ目のリクエストです。十分な長さがあります。"
            }
            """.formatted(stampHistoryId);

        mockMvc.perform(post("/api/stamp-requests")
                .session(employeeSession)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(duplicateRequestJson))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value(containsString("既に申請中のリクエストが存在します")));
    }

    @DisplayName("Conflict: Cannot cancel already approved request")
    @Test
    void cannotCancelAlreadyApprovedRequest() throws Exception {
        // Create and approve request
        MockHttpSession employeeSession = loginAs(EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD);
        Integer requestId = createTestRequest(employeeSession);

        MockHttpSession adminSession = loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
        String approveJson = """
            {
                "approvalNote": "承認しました"
            }
            """;
        mockMvc.perform(post("/api/stamp-requests/{id}/approve", requestId)
                .session(adminSession)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(approveJson))
            .andExpect(status().isOk());

        // Try to cancel approved request (should fail)
        String cancelJson = """
            {
                "cancellationReason": "キャンセルします。十分な長さがあります。"
            }
            """;

        mockMvc.perform(post("/api/stamp-requests/{id}/cancel", requestId)
                .session(employeeSession)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(cancelJson))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value(containsString("既に処理済み")));
    }

    @DisplayName("Conflict: Employee cannot cancel other employee's request")
    @Test
    void employeeCannotCancelOthersRequest() throws Exception {
        // Create request as first employee
        MockHttpSession employee1Session = loginAs(EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD);
        Integer requestId = createTestRequest(employee1Session);

        // Create second employee
        Integer employee2Id = ensureAccount("別の", "社員", "other@example.com", "OtherPass123!", false);
        MockHttpSession employee2Session = loginAs("other@example.com", "OtherPass123!");

        // Try to cancel as second employee (should fail)
        String cancelJson = """
            {
                "cancellationReason": "他人のリクエストをキャンセル試行。十分な長さ。"
            }
            """;

        mockMvc.perform(post("/api/stamp-requests/{id}/cancel", requestId)
                .session(employee2Session)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(cancelJson))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value(containsString("権限がありません")));
    }

    // ========== Helper Methods ==========

    private MockHttpSession loginAs(String email, String password) throws Exception {
        String loginJson = String.format("""
            {
                "email": "%s",
                "password": "%s"
            }
            """, email, password);

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
            .andExpect(status().isOk())
            .andReturn();

        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private Integer ensureAccount(String firstName, String lastName, String email, String rawPassword, boolean admin) {
        String encoded = passwordEncoder.encode(rawPassword);

        Integer existingId = jdbcTemplate.query(
            "SELECT id FROM employee WHERE email = ?",
            rs -> rs.next() ? rs.getInt("id") : null,
            email
        );

        if (existingId != null) {
            jdbcTemplate.update(
                "UPDATE employee SET password = ?, admin_flag = ? WHERE email = ?",
                encoded, admin ? 1 : 0, email
            );
            return existingId;
        } else {
            jdbcTemplate.update(
                "INSERT INTO employee (first_name, last_name, email, password, admin_flag, update_date, profile_metadata) " +
                "VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, '{}'::jsonb)",
                firstName, lastName, email, encoded, admin ? 1 : 0
            );
            return jdbcTemplate.queryForObject("SELECT id FROM employee WHERE email = ?", Integer.class, email);
        }
    }

    private Integer createStampHistory(Integer empId, LocalDate date) {
        OffsetDateTime inTime = date.atTime(8, 0).atOffset(ZoneOffset.ofHours(9));
        OffsetDateTime outTime = date.atTime(17, 0).atOffset(ZoneOffset.ofHours(9));
        OffsetDateTime updateDate = OffsetDateTime.now(ZoneOffset.ofHours(9));

        String year = String.format("%04d", date.getYear());
        String month = String.format("%02d", date.getMonthValue());
        String day = String.format("%02d", date.getDayOfMonth());

        jdbcTemplate.update(
            "INSERT INTO stamp_history (employee_id, stamp_date, year, month, day, in_time, out_time, is_night_shift, update_employee_id, update_date) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, ?, ?)",
            empId, date, year, month, day, inTime, outTime, empId, updateDate
        );

        return jdbcTemplate.queryForObject(
            "SELECT id FROM stamp_history WHERE employee_id = ? AND stamp_date = ? ORDER BY id DESC LIMIT 1",
            Integer.class,
            empId, date
        );
    }

    private Integer createTestRequest(MockHttpSession session) throws Exception {
        String createRequestJson = """
            {
                "stampHistoryId": %d,
                "requestedInTime": "2025-11-14T09:00:00+09:00",
                "requestedOutTime": "2025-11-14T18:00:00+09:00",
                "reason": "テストリクエストです。十分な長さがあります。"
            }
            """.formatted(stampHistoryId);

        MvcResult result = mockMvc.perform(post("/api/stamp-requests")
                .session(session)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(createRequestJson))
            .andExpect(status().isCreated())
            .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        JsonNode root = objectMapper.readTree(responseBody);
        return root.get("id").asInt();
    }
}
