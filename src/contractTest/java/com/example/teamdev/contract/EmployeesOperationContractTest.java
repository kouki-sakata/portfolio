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
class EmployeesOperationContractTest extends PostgresContainerSupport {

    private static final String ADMIN_EMAIL = "openapi.contract.admin@example.com";
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
    void list_employees_unauthorized_matches_contract() throws Exception {
        OpenApi3 api = loadOrGetApi(mockMvc);
        OperationValidator validator = validator(api, "/api/employees", Request.Method.GET);

        MvcResult result = mockMvc.perform(get("/api/employees"))
            .andReturn();

        // 環境により 302(サインインへ) か 401、どちらでも契約が許容していればOK
        int status = result.getResponse().getStatus();
        assertThat(status).isIn(401, 302);
        assertValid(validator, toResponse(result.getResponse(), objectMapper));
    }

    @Test
    void create_employee_201_matches_contract() throws Exception {
        OpenApi3 api = loadOrGetApi(mockMvc);
        OperationValidator validator = validator(api, "/api/employees", Request.Method.POST);

        MockHttpSession session = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        String email = "employee." + System.currentTimeMillis() + "@example.com";

        MvcResult result = mockMvc.perform(post("/api/employees")
                .with(csrf())
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                    "\"firstName\":\"太郎\"," +
                    "\"lastName\":\"山田\"," +
                    "\"email\":\"" + email + "\"," +
                    "\"password\":\"Passw0rd!\"," +
                    "\"admin\":false" +
                "}"))
            .andExpect(status().isCreated())
            .andReturn();

        assertValid(validator, toResponse(result.getResponse(), objectMapper));
    }

    @Test
    void create_employee_409_duplicate_matches_contract() throws Exception {
        OpenApi3 api = loadOrGetApi(mockMvc);
        OperationValidator validator = validator(api, "/api/employees", Request.Method.POST);

        MockHttpSession session = login(ADMIN_EMAIL, ADMIN_PASSWORD);

        // 既存メールで登録して 409 を期待
        MvcResult result = mockMvc.perform(post("/api/employees")
                .with(csrf())
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                    "\"firstName\":\"次郎\"," +
                    "\"lastName\":\"佐藤\"," +
                    "\"email\":\"" + ADMIN_EMAIL + "\"," +
                    "\"password\":\"Passw0rd!\"," +
                    "\"admin\":false" +
                "}"))
            .andReturn();

        assertThat(result.getResponse().getStatus()).isEqualTo(409);
        assertValid(validator, toResponse(result.getResponse(), objectMapper));
    }

    @Test
    void create_employee_400_bad_request_matches_contract() throws Exception {
        OpenApi3 api = loadOrGetApi(mockMvc);
        OperationValidator validator = validator(api, "/api/employees", Request.Method.POST);

        MockHttpSession session = login(ADMIN_EMAIL, ADMIN_PASSWORD);

        // password 未指定で 400
        MvcResult result = mockMvc.perform(post("/api/employees")
                .with(csrf())
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                    "\"firstName\":\"三郎\"," +
                    "\"lastName\":\"高橋\"," +
                    "\"email\":\"invalid.nopass@example.com\"," +
                    "\"admin\":false" +
                "}"))
            .andReturn();

        assertThat(result.getResponse().getStatus()).isEqualTo(400);
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

