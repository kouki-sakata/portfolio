package com.example.teamdev.integration;

import org.junit.jupiter.api.BeforeEach;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("api")
@Transactional
class EmployeeRestControllerSecurityTest extends com.example.teamdev.testconfig.PostgresContainerSupport {

    private static final String USER_EMAIL = "contract.user@example.com";
    private static final String USER_PASSWORD = "UserPass123!";
    private static final String ADMIN_EMAIL = "contract.admin@example.com";
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

    @Test
    void list_employees_requires_authentication() throws Exception {
        mockMvc.perform(get("/api/employees"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void create_employee_without_csrf_is_forbidden() throws Exception {
        mockMvc.perform(post("/api/employees")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                    "\"firstName\":\"太郎\"," +
                    "\"lastName\":\"山田\"," +
                    "\"email\":\"yamada.contract@example.com\"," +
                    "\"password\":\"Passw0rd!\"," +
                    "\"admin\":false" +
                "}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void create_employee_with_user_role_is_forbidden() throws Exception {
        MockHttpSession session = loginAndGetSession(USER_EMAIL, USER_PASSWORD);

        mockMvc.perform(post("/api/employees")
                .with(csrf())
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                    "\"firstName\":\"太郎\"," +
                    "\"lastName\":\"山田\"," +
                    "\"email\":\"yamada.userrole@example.com\"," +
                    "\"password\":\"Passw0rd!\"," +
                    "\"admin\":false" +
                "}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void create_employee_with_admin_role_is_created() throws Exception {
        MockHttpSession session = loginAndGetSession(ADMIN_EMAIL, ADMIN_PASSWORD);

        mockMvc.perform(post("/api/employees")
                .with(csrf())
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                    "\"firstName\":\"次郎\"," +
                    "\"lastName\":\"佐藤\"," +
                    "\"email\":\"sato.jiro.contract@example.com\"," +
                    "\"password\":\"Passw0rd!\"," +
                    "\"admin\":false" +
                "}"))
            .andExpect(status().isCreated());
    }

    private MockHttpSession loginAndGetSession(String email, String rawPassword) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                    "\"email\":\"" + email + "\"," +
                    "\"password\":\"" + rawPassword + "\"" +
                "}"))
            .andExpect(status().isOk())
            .andReturn();

        MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
        assertThat(session).isNotNull();
        return session;
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

