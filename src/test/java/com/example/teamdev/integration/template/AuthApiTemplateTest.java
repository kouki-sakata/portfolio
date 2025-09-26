package com.example.teamdev.integration.template;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.mock.web.MockHttpSession;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("api")
class AuthApiTemplateTest extends com.example.teamdev.integration.support.ApiTestSupport {

    @Autowired
    private MockMvc mockMvc;

    private static final String ADMIN_EMAIL = "template.admin@example.com";
    private static final String ADMIN_PASSWORD = "AdminPass123!";

    @BeforeEach
    void setUp() {
        ensureAccount(ADMIN_EMAIL, ADMIN_PASSWORD, true);
    }

    @DisplayName("GET /api/auth/session - returns 200 with auth state")
    @Test
    void getSession() throws Exception {
        mockMvc.perform(get("/api/auth/session").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());
    }

    @DisplayName("POST /api/auth/login - login with email/password")
    @Test
    void login() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                    "\"email\":\"" + ADMIN_EMAIL + "\"," +
                    "\"password\":\"" + ADMIN_PASSWORD + "\"" +
                "}"))
            .andExpect(status().isOk());
    }
}
