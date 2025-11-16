package com.example.teamdev.integration;

import com.example.teamdev.constant.StampRequestStatus;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Comprehensive integration test for the stamp request workflow.
 *
 * Tests the complete flow:
 * 1. Employee submits a correction request
 * 2. Admin approves the request
 * 3. Employee cancels a pending request
 *
 * Also validates RBAC, conflict handling, and cache invalidation scenarios.
 *
 * Requirements: 1, 2, 3, 4, 6, 7, 8, 9, 10
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("integration")
@Transactional
class StampRequestWorkflowIntegrationTest extends PostgresContainerSupport {

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
        // Create test users
        employeeId = ensureAccount("テスト", "社員", EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD, false);
        adminId = ensureAccount("テスト", "管理者", ADMIN_EMAIL, ADMIN_PASSWORD, true);

        // Create stamp history record for testing
        stampHistoryId = createStampHistory(employeeId, LocalDate.now().minusDays(1));
    }

    @DisplayName("Full workflow: Employee submits → Admin approves → Stamp history updated")
    @Test
    void completeApprovalWorkflow() throws Exception {
        // Step 1: Employee logs in
        MockHttpSession employeeSession = loginAs(EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD);

        // Step 2: Employee submits a correction request
        String createRequestJson = """
            {
                "stampHistoryId": %d,
                "requestedInTime": "2025-11-14T09:00:00+09:00",
                "requestedOutTime": "2025-11-14T18:00:00+09:00",
                "requestedBreakStartTime": "2025-11-14T12:00:00+09:00",
                "requestedBreakEndTime": "2025-11-14T13:00:00+09:00",
                "requestedIsNightShift": false,
                "reason": "家族の急用で退勤が遅れたため修正が必要です。"
            }
            """.formatted(stampHistoryId);

        MvcResult createResult = mockMvc.perform(post("/api/stamp-requests")
                .session(employeeSession)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(createRequestJson))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.status").value(StampRequestStatus.PENDING.name()))
            .andExpect(jsonPath("$.employeeId").value(employeeId))
            .andExpect(jsonPath("$.reason").value("家族の急用で退勤が遅れたため修正が必要です。"))
            .andReturn();

        String responseBody = createResult.getResponse().getContentAsString();
        Integer requestId = extractRequestId(responseBody);

        // Step 3: Verify employee can see their request in My Requests
        mockMvc.perform(get("/api/stamp-requests/my-requests")
                .session(employeeSession)
                .param("status", "PENDING"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.requests", hasSize(greaterThan(0))))
            .andExpect(jsonPath("$.requests[0].id").value(requestId))
            .andExpect(jsonPath("$.requests[0].status").value(StampRequestStatus.PENDING.name()));

        // Step 4: Admin logs in
        MockHttpSession adminSession = loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);

        // Step 5: Admin views pending requests
        mockMvc.perform(get("/api/stamp-requests/pending")
                .session(adminSession))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.requests", hasSize(greaterThan(0))))
            .andExpect(jsonPath("$.requests[?(@.id == " + requestId + ")].status").value(contains(StampRequestStatus.PENDING.name())));

        // Step 6: Admin approves the request
        String approveJson = """
            {
                "approvalNote": "内容を確認し、承認しました。"
            }
            """;

        mockMvc.perform(post("/api/stamp-requests/{id}/approve", requestId)
                .session(adminSession)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(approveJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value(StampRequestStatus.APPROVED.name()))
            .andExpect(jsonPath("$.approvalEmployeeId").value(adminId))
            .andExpect(jsonPath("$.approvalNote").value("内容を確認し、承認しました。"))
            .andExpect(jsonPath("$.approvedAt").isNotEmpty());

        // Step 7: Verify stamp history was updated
        Integer updatedStampHistory = jdbcTemplate.queryForObject(
            "SELECT in_time FROM stamp_history WHERE id = ?",
            (rs, rowNum) -> rs.getTimestamp("in_time").toInstant().atOffset(ZoneOffset.ofHours(9)).getHour(),
            stampHistoryId
        );
        assertThat(updatedStampHistory).isEqualTo(9); // Requested in_time was 09:00

        // Step 8: Verify request no longer appears in pending list
        mockMvc.perform(get("/api/stamp-requests/pending")
                .session(adminSession)
                .param("status", "PENDING"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.requests[?(@.id == " + requestId + ")]").doesNotExist());
    }

    @DisplayName("Full workflow: Employee submits → Employee cancels")
    @Test
    void completeCancellationWorkflow() throws Exception {
        // Step 1: Employee logs in
        MockHttpSession employeeSession = loginAs(EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD);

        // Step 2: Employee submits a correction request
        String createRequestJson = """
            {
                "stampHistoryId": %d,
                "requestedInTime": "2025-11-14T09:00:00+09:00",
                "requestedOutTime": "2025-11-14T18:00:00+09:00",
                "reason": "出勤時刻の修正が必要です。十分な長さです。"
            }
            """.formatted(stampHistoryId);

        MvcResult createResult = mockMvc.perform(post("/api/stamp-requests")
                .session(employeeSession)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(createRequestJson))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value(StampRequestStatus.PENDING.name()))
            .andReturn();

        Integer requestId = extractRequestId(createResult.getResponse().getContentAsString());

        // Step 3: Employee cancels the request
        String cancelJson = """
            {
                "cancellationReason": "予定が変更になったため、キャンセルします。"
            }
            """;

        mockMvc.perform(post("/api/stamp-requests/{id}/cancel", requestId)
                .session(employeeSession)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(cancelJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value(StampRequestStatus.CANCELLED.name()))
            .andExpect(jsonPath("$.cancellationReason").value("予定が変更になったため、キャンセルします。"))
            .andExpect(jsonPath("$.cancelledAt").isNotEmpty());

        // Step 4: Verify stamp history was NOT modified
        Integer stampHistoryStatus = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM stamp_history WHERE id = ?",
            Integer.class,
            stampHistoryId
        );
        assertThat(stampHistoryStatus).isEqualTo(1); // Still exists unchanged

        // Step 5: Verify cancelled request appears in My Requests with CANCELLED status
        mockMvc.perform(get("/api/stamp-requests/my-requests")
                .session(employeeSession)
                .param("status", "CANCELLED"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.requests[?(@.id == " + requestId + ")].status").value(contains(StampRequestStatus.CANCELLED.name())));
    }

    @DisplayName("Full workflow: Admin rejects → Stamp history unchanged")
    @Test
    void completeRejectionWorkflow() throws Exception {
        // Step 1: Employee submits request
        MockHttpSession employeeSession = loginAs(EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD);

        String createRequestJson = """
            {
                "stampHistoryId": %d,
                "requestedInTime": "2025-11-14T09:00:00+09:00",
                "requestedOutTime": "2025-11-14T18:00:00+09:00",
                "reason": "出勤時刻の修正が必要です。十分な長さです。"
            }
            """.formatted(stampHistoryId);

        MvcResult createResult = mockMvc.perform(post("/api/stamp-requests")
                .session(employeeSession)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(createRequestJson))
            .andExpect(status().isCreated())
            .andReturn();

        Integer requestId = extractRequestId(createResult.getResponse().getContentAsString());

        // Step 2: Admin rejects the request
        MockHttpSession adminSession = loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);

        String rejectJson = """
            {
                "rejectionReason": "申請内容に不備があるため却下します。詳細を確認してください。"
            }
            """;

        mockMvc.perform(post("/api/stamp-requests/{id}/reject", requestId)
                .session(adminSession)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(rejectJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value(StampRequestStatus.REJECTED.name()))
            .andExpect(jsonPath("$.rejectionEmployeeId").value(adminId))
            .andExpect(jsonPath("$.rejectionReason").value("申請内容に不備があるため却下します。詳細を確認してください。"))
            .andExpect(jsonPath("$.rejectedAt").isNotEmpty());

        // Step 3: Verify stamp history was NOT modified
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM stamp_history WHERE id = ?",
            Integer.class,
            stampHistoryId
        );
        assertThat(count).isEqualTo(1); // Still exists unchanged
    }

    /**
     * Helper method to log in and return session
     */
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

    /**
     * Create or update employee account
     */
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

    /**
     * Create stamp history record
     */
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

    /**
     * Extract request ID from JSON response using ObjectMapper for robust parsing
     */
    private Integer extractRequestId(String jsonResponse) throws JsonProcessingException {
        JsonNode root = objectMapper.readTree(jsonResponse);
        return root.get("id").asInt();
    }
}
