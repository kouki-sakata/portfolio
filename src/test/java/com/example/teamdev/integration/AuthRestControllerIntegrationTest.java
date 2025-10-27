package com.example.teamdev.integration;

import com.example.teamdev.testconfig.PostgresContainerSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.DisplayName;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for the authentication REST endpoints.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("api")
@Transactional
class AuthRestControllerIntegrationTest extends PostgresContainerSupport {

    private static final String USER_EMAIL = "test.user@example.com";
    private static final String USER_PASSWORD = "TestPass123!";
    private static final String ADMIN_EMAIL = "admin.user@example.com";
    private static final String ADMIN_PASSWORD = "AdminPass123!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        ensureAccount(ADMIN_EMAIL, ADMIN_PASSWORD, true);
        ensureAccount(USER_EMAIL, USER_PASSWORD, false);
    }

    @DisplayName("/api/auth/session returns unauthenticated before login")
    @Test
    void sessionWithoutLoginReturnsAnonymousState() throws Exception {
        mockMvc.perform(get("/api/auth/session"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.authenticated").value(false))
            .andExpect(jsonPath("$.employee").doesNotExist());
    }

    @DisplayName("/api/auth/session issues CSRF cookie and header")
    @Test
    void sessionEndpointSetsCsrfArtifacts() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/auth/session"))
            .andExpect(status().isOk())
            .andReturn();

        var csrfCookie = result.getResponse().getCookie("XSRF-TOKEN");
        assertThat(csrfCookie)
            .as("CSRF cookie should be issued")
            .isNotNull();
        assertThat(csrfCookie.getValue())
            .as("CSRF cookie should contain a token value")
            .isNotBlank();

        assertThat(result.getResponse().getHeader("X-XSRF-TOKEN"))
            .as("Response header should expose CSRF token")
            .isNotNull();
    }

    @DisplayName("Successful login returns employee summary and persists session")
    @Test
    void loginWithValidCredentialsCreatesSession() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                    "\"email\":\"" + ADMIN_EMAIL + "\"," +
                    "\"password\":\"" + ADMIN_PASSWORD + "\"" +
                    "}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.employee.email").value(ADMIN_EMAIL))
            .andExpect(jsonPath("$.employee.admin").value(true))
            .andReturn();

        MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
        assertThat(session).as("Session should be created on successful login").isNotNull();

        mockMvc.perform(get("/api/auth/session").session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.authenticated").value(true))
            .andExpect(jsonPath("$.employee.email").value(ADMIN_EMAIL))
            .andExpect(jsonPath("$.employee.admin").value(true));
    }

    @DisplayName("Invalid password results in HTTP 401")
    @Test
    void loginWithInvalidPasswordReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                    "\"email\":\"" + ADMIN_EMAIL + "\"," +
                    "\"password\":\"wrong-password\"" +
                    "}"))
            .andExpect(status().isUnauthorized());
    }

    @DisplayName("Unknown account results in HTTP 401")
    @Test
    void loginWithUnknownAccountReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                    "\"email\":\"no.user@example.com\"," +
                    "\"password\":\"whatever\"" +
                    "}"))
            .andExpect(status().isUnauthorized());
    }

    private void ensureAccount(String email, String rawPassword, boolean admin) {
        String encoded = passwordEncoder.encode(rawPassword);
        int updated = jdbcTemplate.update("UPDATE employee SET password = ?, admin_flag = ? WHERE email = ?",
            encoded,
            admin ? 1 : 0,
            email);

        if (updated == 0) {
            jdbcTemplate.update(
                "INSERT INTO employee (first_name, last_name, email, password, admin_flag, update_date) " +
                    "VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                admin ? "テスト" : "テスト",
                admin ? "管理者" : "太郎",
                email,
                encoded,
                admin ? 1 : 0
            );
        }
    }
}
