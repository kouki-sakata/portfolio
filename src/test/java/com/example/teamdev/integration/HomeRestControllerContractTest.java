package com.example.teamdev.integration;

import com.example.teamdev.integration.support.ApiTestSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("api")
class HomeRestControllerContractTest extends ApiTestSupport {

    @Autowired
    private MockMvc mockMvc;

    private static final String ADMIN_EMAIL = "contract.home.admin@example.com";
    private static final String ADMIN_PASSWORD = "AdminPass123!";

    private MockHttpSession session;

    @BeforeEach
    void setUp() throws Exception {
        ensureAccount(ADMIN_EMAIL, ADMIN_PASSWORD, true);
        session = login(ADMIN_EMAIL, ADMIN_PASSWORD);
    }

    @DisplayName("GET /api/home/overview returns employee + news schema (200)")
    @Test
    void overview_schema_and_positive() throws Exception {
        mockMvc.perform(get("/api/home/overview").session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.employee").exists())
            .andExpect(jsonPath("$.employee.id").exists())
            .andExpect(jsonPath("$.employee.email").exists())
            .andExpect(jsonPath("$.employee.admin").exists())
            .andExpect(jsonPath("$.news").isArray())
            .andExpect(jsonPath("$.attendance").exists());
    }

    @DisplayName("POST /api/home/stamps accepts valid body and returns message (200)")
    @Test
    void stamps_schema_and_positive() throws Exception {
        String body = "{" +
            "\"stampType\":\"1\"," +
            "\"stampTime\":\"2025-01-01T09:00:00+09:00\"," +
            "\"nightWorkFlag\":\"0\"" +
        "}";

        mockMvc.perform(post("/api/home/stamps")
                .with(csrf())
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").exists());
    }

    @DisplayName("POST /api/home/breaks/toggle returns 204")
    @Test
    void breaks_toggle_returns_no_content() throws Exception {
        String body = "{" +
            "\"timestamp\":\"2025-01-01T12:00:00+09:00\"" +
            "}";

        mockMvc.perform(post("/api/home/breaks/toggle")
                .with(csrf())
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isNoContent());
    }
}
