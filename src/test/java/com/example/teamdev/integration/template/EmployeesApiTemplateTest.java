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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("api")
class EmployeesApiTemplateTest extends com.example.teamdev.integration.support.ApiTestSupport {

    @Autowired
    private MockMvc mockMvc;
    private static final String ADMIN_EMAIL = "template.emp.admin@example.com";
    private static final String ADMIN_PASSWORD = "AdminPass123!";
    private static final String USER_EMAIL = "template.emp.user@example.com";
    private static final String USER_PASSWORD = "UserPass123!";

    @BeforeEach
    void setUp() {
        ensureAccount(ADMIN_EMAIL, ADMIN_PASSWORD, true);
        ensureAccount(USER_EMAIL, USER_PASSWORD, false);
    }

    @DisplayName("GET /api/employees - list employees (auth required: 401 or 302)")
    @Test
    void listEmployees() throws Exception {
        int s = mockMvc.perform(get("/api/employees").accept(MediaType.APPLICATION_JSON))
            .andReturn().getResponse().getStatus();
        assertThat(s).isIn(401, 302);
    }

    @DisplayName("POST /api/employees - create employee without CSRF -> 403")
    @Test
    void createEmployeeWithoutCsrf() throws Exception {
        MockHttpSession session = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        mockMvc.perform(post("/api/employees")
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                    "\"firstName\":\"太郎\"," +
                    "\"lastName\":\"山田\"," +
                    "\"email\":\"" + uniqueEmail("sample.template") + "\"," +
                    "\"password\":\"Passw0rd!\"," +
                    "\"admin\":false" +
                "}"))
            .andExpect(status().isForbidden());
    }

    @DisplayName("POST /api/employees - duplicate email -> 409 (ADMIN)")
    @Test
    void createEmployeeDuplicate409() throws Exception {
        MockHttpSession session = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        mockMvc.perform(post("/api/employees")
                .with(csrf())
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                    "\"firstName\":\"重複\"," +
                    "\"lastName\":\"太郎\"," +
                    "\"email\":\"" + ADMIN_EMAIL + "\"," +
                    "\"password\":\"Passw0rd!\"," +
                    "\"admin\":false" +
                "}"))
            .andExpect(status().isConflict());
    }

    @DisplayName("POST /api/employees - missing password -> 400 (ADMIN)")
    @Test
    void createEmployeeMissingPassword400() throws Exception {
        MockHttpSession session = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        mockMvc.perform(post("/api/employees")
                .with(csrf())
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                    "\"firstName\":\"検証\"," +
                    "\"lastName\":\"太郎\"," +
                    "\"email\":\"" + uniqueEmail("nopass.template") + "\"," +
                    "\"admin\":false" +
                "}"))
            .andExpect(status().isBadRequest());
    }

    @DisplayName("POST /api/employees - user role -> 403")
    @Test
    void createEmployeeUserRole403() throws Exception {
        MockHttpSession session = login(USER_EMAIL, USER_PASSWORD);
        mockMvc.perform(post("/api/employees")
                .with(csrf())
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                    "\"firstName\":\"権限\"," +
                    "\"lastName\":\"検証\"," +
                    "\"email\":\"" + uniqueEmail("user.role.template") + "\"," +
                    "\"password\":\"Passw0rd!\"," +
                    "\"admin\":false" +
                "}"))
            .andExpect(status().isForbidden());
    }

    @DisplayName("PUT /api/employees/{id} - update OK (ADMIN)")
    @Test
    void updateEmployee200() throws Exception {
        MockHttpSession session = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        // create first
        String email = uniqueEmail("update.ok");
        int id = createEmployee(session, email);

        mockMvc.perform(put("/api/employees/{id}", id)
                .with(csrf())
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                    "\"firstName\":\"更新\"," +
                    "\"lastName\":\"太郎\"," +
                    "\"email\":\"" + email + "\"," +
                    "\"admin\":false" +
                "}"))
            .andExpect(status().isOk());
    }

    @DisplayName("PUT /api/employees/{id} - user role -> 403")
    @Test
    void updateEmployeeUser403() throws Exception {
        MockHttpSession admin = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        int id = createEmployee(admin, uniqueEmail("update.user"));

        MockHttpSession user = login(USER_EMAIL, USER_PASSWORD);
        mockMvc.perform(put("/api/employees/{id}", id)
                .with(csrf())
                .session(user)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                    "\"firstName\":\"権限\"," +
                    "\"lastName\":\"不可\"," +
                    "\"email\":\"" + uniqueEmail("update.user.role") + "\"," +
                    "\"admin\":false" +
                "}"))
            .andExpect(status().isForbidden());
    }

    @DisplayName("DELETE /api/employees - delete OK (ADMIN)")
    @Test
    void deleteEmployee204() throws Exception {
        MockHttpSession session = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        int id = createEmployee(session, uniqueEmail("delete.ok"));

        mockMvc.perform(delete("/api/employees")
                .with(csrf())
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"ids\":[" + id + "]}"))
            .andExpect(status().isNoContent());
    }

    @DisplayName("DELETE /api/employees - user role -> 403")
    @Test
    void deleteEmployeeUser403() throws Exception {
        MockHttpSession admin = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        int id = createEmployee(admin, uniqueEmail("delete.user"));

        MockHttpSession user = login(USER_EMAIL, USER_PASSWORD);
        mockMvc.perform(delete("/api/employees")
                .with(csrf())
                .session(user)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"ids\":[" + id + "]}"))
            .andExpect(status().isForbidden());
    }

    private int createEmployee(MockHttpSession session, String email) throws Exception {
        String body = "{" +
            "\"firstName\":\"作成\"," +
            "\"lastName\":\"太郎\"," +
            "\"email\":\"" + email + "\"," +
            "\"password\":\"Passw0rd!\"," +
            "\"admin\":false" +
        "}";
        String content = mockMvc.perform(post("/api/employees")
                .with(csrf())
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(content).get("id").asInt();
    }
}
