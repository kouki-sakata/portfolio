package com.example.teamdev.integration;

import com.example.teamdev.integration.support.ApiTestSupport;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("api")
@Transactional
class StampHistoryRequestStatusIntegrationTest extends ApiTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final String USER_EMAIL = "request.status.user@example.com";
    private static final String USER_PASSWORD = "UserPass123!";
    private static final ZoneOffset JST = ZoneOffset.ofHours(9);

    private MockHttpSession session;
    private int employeeId;

    @BeforeEach
    void setUp() throws Exception {
        ensureAccount(USER_EMAIL, USER_PASSWORD, false);
        session = login(USER_EMAIL, USER_PASSWORD);
        employeeId = jdbcTemplate.queryForObject(
            "SELECT id FROM employee WHERE email = ?",
            Integer.class,
            USER_EMAIL
        );
    }

    @DisplayName("申請がない場合、requestStatusとrequestIdが返却されない")
    @Test
    void returnsNoRequestFieldsWhenNoRequest() throws Exception {
        // 打刻データを作成（申請なし）
        insertStampHistory(LocalDate.of(2025, 5, 1), LocalDateTime.of(2025, 5, 1, 9, 0), LocalDateTime.of(2025, 5, 1, 18, 0));

        // API呼び出し
        mockMvc.perform(get("/api/stamp-history")
                .param("year", "2025")
                .param("month", "05")
                .session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.entries").isArray())
            .andExpect(jsonPath("$.entries[0].requestStatus").doesNotExist())
            .andExpect(jsonPath("$.entries[0].requestId").doesNotExist());
    }

    @DisplayName("申請送信後、requestStatusがPENDINGでレスポンスされる")
    @Test
    void returnsPendingStatusAfterRequestSubmission() throws Exception {
        // 打刻データを作成
        LocalDate stampDate = LocalDate.of(2025, 5, 2);
        int stampHistoryId = insertStampHistory(stampDate, LocalDateTime.of(2025, 5, 2, 9, 0), LocalDateTime.of(2025, 5, 2, 18, 0));

        // 申請を作成（PENDING）
        int requestId = insertStampRequest(stampHistoryId, stampDate, "PENDING", LocalDateTime.of(2025, 5, 2, 10, 0));

        // API呼び出し
        mockMvc.perform(get("/api/stamp-history")
                .param("year", "2025")
                .param("month", "05")
                .session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.entries").isArray())
            .andExpect(jsonPath("$.entries[1].requestStatus").value("PENDING"))
            .andExpect(jsonPath("$.entries[1].requestId").value(requestId));
    }

    @DisplayName("承認後、requestStatusがAPPROVEDでレスポンスされる")
    @Test
    void returnsApprovedStatusAfterApproval() throws Exception {
        // 打刻データを作成
        LocalDate stampDate = LocalDate.of(2025, 5, 3);
        int stampHistoryId = insertStampHistory(stampDate, LocalDateTime.of(2025, 5, 3, 9, 0), LocalDateTime.of(2025, 5, 3, 18, 0));

        // 申請を作成（APPROVED）
        int requestId = insertStampRequest(stampHistoryId, stampDate, "APPROVED", LocalDateTime.of(2025, 5, 3, 10, 0));

        // API呼び出し
        mockMvc.perform(get("/api/stamp-history")
                .param("year", "2025")
                .param("month", "05")
                .session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.entries").isArray())
            .andExpect(jsonPath("$.entries[2].requestStatus").value("APPROVED"))
            .andExpect(jsonPath("$.entries[2].requestId").value(requestId));
    }

    @DisplayName("却下後、requestStatusがREJECTEDでレスポンスされる")
    @Test
    void returnsRejectedStatusAfterRejection() throws Exception {
        // 打刻データを作成
        LocalDate stampDate = LocalDate.of(2025, 5, 4);
        int stampHistoryId = insertStampHistory(stampDate, LocalDateTime.of(2025, 5, 4, 9, 0), LocalDateTime.of(2025, 5, 4, 18, 0));

        // 申請を作成（REJECTED）
        int requestId = insertStampRequest(stampHistoryId, stampDate, "REJECTED", LocalDateTime.of(2025, 5, 4, 10, 0));

        // API呼び出し
        mockMvc.perform(get("/api/stamp-history")
                .param("year", "2025")
                .param("month", "05")
                .session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.entries").isArray())
            .andExpect(jsonPath("$.entries[3].requestStatus").value("REJECTED"))
            .andExpect(jsonPath("$.entries[3].requestId").value(requestId));
    }

    @DisplayName("取り下げ後、requestStatusがCANCELLEDでレスポンスされる")
    @Test
    void returnsCancelledStatusAfterCancellation() throws Exception {
        // 打刻データを作成
        LocalDate stampDate = LocalDate.of(2025, 5, 5);
        int stampHistoryId = insertStampHistory(stampDate, LocalDateTime.of(2025, 5, 5, 9, 0), LocalDateTime.of(2025, 5, 5, 18, 0));

        // 申請を作成（CANCELLED）
        int requestId = insertStampRequest(stampHistoryId, stampDate, "CANCELLED", LocalDateTime.of(2025, 5, 5, 10, 0));

        // API呼び出し
        mockMvc.perform(get("/api/stamp-history")
                .param("year", "2025")
                .param("month", "05")
                .session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.entries").isArray())
            .andExpect(jsonPath("$.entries[4].requestStatus").value("CANCELLED"))
            .andExpect(jsonPath("$.entries[4].requestId").value(requestId));
    }

    @DisplayName("複数申請がある場合、最新のrequestStatusがレスポンスされる")
    @Test
    void returnsLatestStatusWhenMultipleRequests() throws Exception {
        // 打刻データを作成
        LocalDate stampDate = LocalDate.of(2025, 5, 6);
        int stampHistoryId = insertStampHistory(stampDate, LocalDateTime.of(2025, 5, 6, 9, 0), LocalDateTime.of(2025, 5, 6, 18, 0));

        // 古い申請を作成（PENDING）
        insertStampRequest(stampHistoryId, stampDate, "PENDING", LocalDateTime.of(2025, 5, 6, 10, 0));

        // 新しい申請を作成（APPROVED）
        int latestRequestId = insertStampRequest(stampHistoryId, stampDate, "APPROVED", LocalDateTime.of(2025, 5, 6, 11, 0));

        // API呼び出し
        mockMvc.perform(get("/api/stamp-history")
                .param("year", "2025")
                .param("month", "05")
                .session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.entries").isArray())
            .andExpect(jsonPath("$.entries[5].requestStatus").value("APPROVED"))
            .andExpect(jsonPath("$.entries[5].requestId").value(latestRequestId));
    }

    // ヘルパーメソッド

    private int insertStampHistory(LocalDate stampDate, LocalDateTime inTime, LocalDateTime outTime) {
        OffsetDateTime inTimeOffset = inTime.atOffset(JST);
        OffsetDateTime outTimeOffset = outTime.atOffset(JST);

        jdbcTemplate.update(
            """
            INSERT INTO stamp_history (stamp_date, year, month, day, employee_id, in_time, out_time, update_employee_id, update_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            """,
            stampDate,
            String.format("%04d", stampDate.getYear()),
            String.format("%02d", stampDate.getMonthValue()),
            String.format("%02d", stampDate.getDayOfMonth()),
            employeeId,
            Timestamp.from(inTimeOffset.toInstant()),
            Timestamp.from(outTimeOffset.toInstant()),
            employeeId
        );

        Integer stampHistoryId = jdbcTemplate.queryForObject(
            """
            SELECT id FROM stamp_history
            WHERE employee_id = ? AND stamp_date = ?
            ORDER BY id DESC LIMIT 1
            """,
            Integer.class,
            employeeId,
            stampDate
        );

        if (stampHistoryId == null) {
            throw new IllegalStateException("Failed to insert stamp_history record");
        }

        return stampHistoryId;
    }

    private int insertStampRequest(int stampHistoryId, LocalDate stampDate, String status, LocalDateTime createdAt) {
        OffsetDateTime createdAtOffset = createdAt.atOffset(JST);
        OffsetDateTime requestedInTime = LocalDateTime.of(stampDate.getYear(), stampDate.getMonthValue(), stampDate.getDayOfMonth(), 9, 30).atOffset(JST);
        OffsetDateTime requestedOutTime = LocalDateTime.of(stampDate.getYear(), stampDate.getMonthValue(), stampDate.getDayOfMonth(), 18, 30).atOffset(JST);

        Integer requestId = jdbcTemplate.queryForObject(
            """
            INSERT INTO stamp_request (
                employee_id, stamp_history_id, stamp_date,
                requested_in_time, requested_out_time,
                reason, status, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, CAST(? AS stamp_request_status), ?, ?)
            RETURNING id
            """,
            Integer.class,
            employeeId,
            stampHistoryId,
            stampDate,
            Timestamp.from(requestedInTime.toInstant()),
            Timestamp.from(requestedOutTime.toInstant()),
            "Integration test request reason for approval workflow",
            status,
            Timestamp.from(createdAtOffset.toInstant()),
            Timestamp.from(createdAtOffset.toInstant())
        );

        if (requestId == null) {
            throw new IllegalStateException("Failed to insert stamp_request record");
        }

        return requestId;
    }
}
