package com.example.teamdev.integration.template;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockHttpSession;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("api")
class HomeApiTemplateTest extends com.example.teamdev.integration.support.ApiTestSupport {

    @Autowired
    private MockMvc mockMvc;
    private static final String ADMIN_EMAIL = "template.home.admin@example.com";
    private static final String ADMIN_PASSWORD = "AdminPass123!";

    @BeforeEach
    void setUp() {
        ensureAccount(ADMIN_EMAIL, ADMIN_PASSWORD, true);
    }

    @DisplayName("GET /api/home/overview - dashboard (auth required: 401 or 302)")
    @Test
    void overview() throws Exception {
        int s = mockMvc.perform(get("/api/home/overview").accept(MediaType.APPLICATION_JSON))
            .andReturn().getResponse().getStatus();
        assertThat(s).isIn(401, 302);
    }

    @DisplayName("POST /api/home/stamps - 403 without auth")
    @Test
    void stamps() throws Exception {
        int s = mockMvc.perform(post("/api/home/stamps")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"stampType\":\"ATTENDANCE\",\"stampTime\":\"2025-01-01T09:00:00\",\"nightWorkFlag\":\"0\"}"))
            .andReturn().getResponse().getStatus();
        assertThat(s).isIn(401, 403, 302);
    }
}
