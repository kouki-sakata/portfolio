package com.example.teamdev.integration;

import com.example.teamdev.integration.support.ApiTestSupport;
import java.sql.Timestamp;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("api")
class StampHistoryRestControllerContractTest extends ApiTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final String USER_EMAIL = "contract.history.user@example.com";
    private static final String USER_PASSWORD = "UserPass123!";

    private MockHttpSession session;

    @BeforeEach
    void setUp() throws Exception {
        ensureAccount(USER_EMAIL, USER_PASSWORD, false);
        session = login(USER_EMAIL, USER_PASSWORD);
    }

    @DisplayName("GET /api/stamp-history returns schema with defaults (200)")
    @Test
    void history_schema_and_positive_defaults() throws Exception {
        mockMvc.perform(get("/api/stamp-history").session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.selectedYear").exists())
            .andExpect(jsonPath("$.selectedMonth").exists())
            .andExpect(jsonPath("$.years").isArray())
            .andExpect(jsonPath("$.months").isArray())
            .andExpect(jsonPath("$.entries").isArray());
    }

    @DisplayName("GET /api/stamp-history respects year/month params (200)")
    @Test
    void history_schema_and_positive_with_params() throws Exception {
        mockMvc.perform(get("/api/stamp-history")
                .param("year", "2030")
                .param("month", "02")
                .session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.selectedYear").value("2030"))
            .andExpect(jsonPath("$.selectedMonth").value("02"))
            .andExpect(jsonPath("$.years").isArray())
            .andExpect(jsonPath("$.months").isArray())
            .andExpect(jsonPath("$.entries").isArray());
    }

    @DisplayName("GET /api/stamp-history returns break/overtime fields when data exists")
    @Test
    void history_contains_break_and_overtime_fields() throws Exception {
        OffsetDateTime in = OffsetDateTime.of(2025, 2, 10, 9, 0, 0, 0, ZoneOffset.ofHours(9));
        OffsetDateTime breakStart = in.plusHours(3);
        OffsetDateTime breakEnd = breakStart.plusMinutes(45);
        OffsetDateTime out = in.plusHours(9);

        jdbcTemplate.update(
            "INSERT INTO stamp_history (year, month, day, employee_id, in_time, out_time, break_start_time, break_end_time, update_employee_id, update_date) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            "2025",
            "02",
            "10",
            getEmployeeId(),
            Timestamp.from(in.toInstant()),
            Timestamp.from(out.toInstant()),
            Timestamp.from(breakStart.toInstant()),
            Timestamp.from(breakEnd.toInstant()),
            getEmployeeId(),
            Timestamp.from(OffsetDateTime.now().toInstant())
        );

        mockMvc.perform(get("/api/stamp-history")
                .param("year", "2025")
                .param("month", "02")
                .session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.entries").isArray())
            .andExpect(jsonPath("$.entries[9].breakStartTime").value("12:00"))
            .andExpect(jsonPath("$.entries[9].breakEndTime").value("12:45"))
            .andExpect(jsonPath("$.entries[9].overtimeMinutes").isNumber());
    }

    private int getEmployeeId() {
        return jdbcTemplate.queryForObject(
            "SELECT id FROM employee WHERE email = ?",
            Integer.class,
            USER_EMAIL
        );
    }
}

