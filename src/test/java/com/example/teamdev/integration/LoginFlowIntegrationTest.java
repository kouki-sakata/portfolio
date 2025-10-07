package com.example.teamdev.integration;

import com.example.teamdev.testconfig.PostgresContainerSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Comprehensive integration tests covering login, validation, session inspection, and logout flows.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LoginFlowIntegrationTest extends PostgresContainerSupport {

    private static final String ADMIN_EMAIL = "admin.user@example.com";
    private static final String ADMIN_PASSWORD = "AdminPass123!";
    private static final String USER_EMAIL = "test.user@example.com";
    private static final String USER_PASSWORD = "TestPass123!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUpAccounts() {
        ensureAccount(ADMIN_EMAIL, ADMIN_PASSWORD, true);
        ensureAccount(USER_EMAIL, USER_PASSWORD, false);
    }

    @Nested
    @DisplayName("Session endpoint")
    class SessionEndpoint {

        @Test
        @DisplayName("Anonymous request returns unauthenticated JSON")
        void sessionWithoutLogin() throws Exception {
            mockMvc.perform(get("/api/auth/session"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(false))
                .andExpect(jsonPath("$.employee").doesNotExist());
        }

        @Test
        @DisplayName("Authenticated session returns employee summary")
        void sessionAfterLogin() throws Exception {
            MockHttpSession session = performLogin(ADMIN_EMAIL, ADMIN_PASSWORD);

            mockMvc.perform(get("/api/auth/session").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.employee.email").value(ADMIN_EMAIL))
                .andExpect(jsonPath("$.employee.admin").value(true));
        }
    }

    @Nested
    @DisplayName("Login endpoint")
    class LoginEndpoint {

        @Test
        @DisplayName("Successful login issues session and returns employee summary")
        void loginSuccess() throws Exception {
            MvcResult result = mockMvc.perform(post("/api/auth/login")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(jsonBody(ADMIN_EMAIL, ADMIN_PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.employee.email").value(ADMIN_EMAIL))
                .andExpect(jsonPath("$.employee.admin").value(true))
                .andReturn();

            MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
            assertThat(session).as("Session should be created on successful login").isNotNull();
            assertThat(session.getId()).isNotBlank();
        }

        @Test
        @DisplayName("Invalid password produces 401")
        void loginInvalidPassword() throws Exception {
            mockMvc.perform(post("/api/auth/login")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(jsonBody(ADMIN_EMAIL, "wrong")))
                .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Unknown email produces 401")
        void loginUnknownEmail() throws Exception {
            mockMvc.perform(post("/api/auth/login")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(jsonBody("missing.user@example.com", USER_PASSWORD)))
                .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Validation errors propagate as 400")
        void loginValidationErrors() throws Exception {
            mockMvc.perform(post("/api/auth/login")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Logout endpoint")
    class LogoutEndpoint {

        @Test
        @DisplayName("Logout clears session and subsequent access is anonymous")
        void logoutClearsSession() throws Exception {
            MockHttpSession session = performLogin(ADMIN_EMAIL, ADMIN_PASSWORD);

            mockMvc.perform(post("/api/auth/logout").session(session).with(csrf()))
                .andExpect(status().isNoContent())
                .andExpect(cookie().maxAge("JSESSIONID", 0));

            mockMvc.perform(get("/api/auth/session").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(false));
        }

        @Test
        @DisplayName("Anonymous logout still succeeds with 204")
        void logoutWithoutSession() throws Exception {
            mockMvc.perform(post("/api/auth/logout").with(csrf()))
                .andExpect(status().isNoContent());
        }
    }

    @Nested
    @DisplayName("Legacy signin routes")
    class LegacyRoutes {

        @Test
        @DisplayName("Unauthenticated access to legacy home redirects to signin")
        void legacyHomeRedirectsToSignin() throws Exception {
            mockMvc.perform(get("/home/init"))
                .andExpect(status().is3xxRedirection());
        }

        @Test
        @DisplayName("Signin route forwards to SPA entry point")
        void signinForwardsToSpa() throws Exception {
            mockMvc.perform(get("/signin"))
                .andExpect(status().isOk());
        }
    }

    private MockHttpSession performLogin(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonBody(email, password)))
            .andExpect(status().isOk())
            .andReturn();

        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private String jsonBody(String email, String password) {
        return "{" +
            "\"email\":\"" + email + "\"," +
            "\"password\":\"" + password + "\"" +
            "}";
    }

    private void ensureAccount(String email, String rawPassword, boolean admin) {
        String encoded = passwordEncoder.encode(rawPassword);
        int updated = jdbcTemplate.update(
            "UPDATE employee SET password = ?, admin_flag = ? WHERE email = ?",
            encoded,
            admin ? 1 : 0,
            email
        );

        if (updated == 0) {
            jdbcTemplate.update(
                "INSERT INTO employee (first_name, last_name, email, password, admin_flag, update_date) " +
                    "VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                "テスト",
                admin ? "管理者" : "太郎",
                email,
                encoded,
                admin ? 1 : 0
            );
        }
    }
}
