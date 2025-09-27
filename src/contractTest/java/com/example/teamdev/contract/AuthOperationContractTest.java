package com.example.teamdev.contract;

import com.example.teamdev.testconfig.PostgresContainerSupport;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.openapi4j.operation.validator.model.Request;
import org.openapi4j.operation.validator.validation.OperationValidator;
import org.openapi4j.parser.model.v3.OpenApi3;
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

import static com.example.teamdev.contract.OperationContractSupport.*;
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
class AuthOperationContractTest extends PostgresContainerSupport {

    private static final String ADMIN_EMAIL = "openapi.admin@example.com";
    private static final String ADMIN_PASSWORD = "AdminPass123!";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        ensureAccount(ADMIN_EMAIL, ADMIN_PASSWORD, true);
    }

    @Test
    void session_schema_is_valid_for_anonymous() throws Exception {
        OpenApi3 api = loadOrGetApi(mockMvc);
        OperationValidator validator = validator(api, "/api/auth/session", Request.Method.GET);

        MvcResult result = mockMvc.perform(get("/api/auth/session").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andReturn();

        assertValid(validator, toResponse(result.getResponse(), objectMapper));
    }

    @Test
    void session_schema_is_valid_for_authenticated() throws Exception {
        OpenApi3 api = loadOrGetApi(mockMvc);
        OperationValidator validator = validator(api, "/api/auth/session", Request.Method.GET);

        MockHttpSession session = login(ADMIN_EMAIL, ADMIN_PASSWORD);

        MvcResult result = mockMvc.perform(get("/api/auth/session").session(session).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andReturn();

        assertValid(validator, toResponse(result.getResponse(), objectMapper));
    }

    private MockHttpSession login(String email, String password) throws Exception {
        MvcResult login = mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                    "\"email\":\"" + email + "\"," +
                    "\"password\":\"" + password + "\"" +
                "}"))
            .andExpect(status().isOk())
            .andReturn();
        return (MockHttpSession) login.getRequest().getSession(false);
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

