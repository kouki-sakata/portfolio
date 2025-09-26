package com.example.teamdev.integration;

import com.example.teamdev.integration.support.ApiTestSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
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
}

