package com.example.teamdev.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * 従業員登録機能の統合テスト
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class EmployeeRegistrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"ADMIN"})
    public void testEmployeeManagePageAccess() throws Exception {
        mockMvc.perform(get("/employeemanage/init"))
                .andExpect(status().isOk())
                .andExpect(view().name("./employeemanage/employee-manage"))
                .andExpect(model().attributeExists("employeeManageForm"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("従業員情報　新規登録・変更")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("regist_form")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("_csrf")));
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"ADMIN"})
    public void testEmployeeRegistrationWithValidData() throws Exception {
        mockMvc.perform(post("/employeemanage/regist")
                .with(csrf())
                .param("firstName", "テスト")
                .param("lastName", "太郎")
                .param("email", "test.taro@example.com")
                .param("password", "testpass123")
                .param("adminFlag", "0"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/employeemanage/init"));
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"ADMIN"})
    public void testEmployeeRegistrationWithInvalidEmail() throws Exception {
        mockMvc.perform(post("/employeemanage/regist")
                .with(csrf())
                .param("firstName", "テスト")
                .param("lastName", "太郎")
                .param("email", "invalid-email")
                .param("password", "testpass123")
                .param("adminFlag", "0"))
                .andExpect(status().isOk())
                .andExpect(view().name("./employeemanage/employee-manage"))
                .andExpect(model().hasErrors());
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"ADMIN"})
    public void testEmployeeRegistrationWithDuplicateEmail() throws Exception {
        // 既存のメールアドレス (test@gmail.com) で登録を試行
        mockMvc.perform(post("/employeemanage/regist")
                .with(csrf())
                .param("firstName", "テスト")
                .param("lastName", "重複")
                .param("email", "test@gmail.com") // 既存のメールアドレス
                .param("password", "testpass123")
                .param("adminFlag", "0"))
                .andExpect(status().isOk())
                .andExpect(view().name("./employeemanage/employee-manage"))
                .andExpect(model().attribute("globalError", org.hamcrest.Matchers.containsString("test@gmail.com")))
                .andExpect(model().attribute("globalError", org.hamcrest.Matchers.containsString("既に使用されています")));
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"ADMIN"})
    public void testEmployeeRegistrationWithoutCSRF_ShouldFail() throws Exception {
        mockMvc.perform(post("/employeemanage/regist")
                .param("firstName", "テスト")
                .param("lastName", "太郎")
                .param("email", "test.csrf@example.com")
                .param("password", "testpass123")
                .param("adminFlag", "0"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "user@gmail.com", roles = {"USER"})
    public void testEmployeeRegistrationWithUserRole_ShouldFail() throws Exception {
        mockMvc.perform(post("/employeemanage/regist")
                .with(csrf())
                .param("firstName", "テスト")
                .param("lastName", "太郎")
                .param("email", "test.user@example.com")
                .param("password", "testpass123")
                .param("adminFlag", "0"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"ADMIN"})
    public void testDataTablesDataEndpoint() throws Exception {
        mockMvc.perform(post("/employeemanage/data")
                .with(csrf())
                .contentType("application/json")
                .content("{\"draw\":1,\"start\":0,\"length\":10}"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$.draw").value(1))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"ADMIN"})
    public void testEmployeeDeleteFunctionality() throws Exception {
        // 削除機能のテスト（実際のIDは使用しない）
        mockMvc.perform(post("/employeemanage/delete")
                .with(csrf())
                .param("idList", "999")) // 存在しないIDでテスト
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/employeemanage/init"));
    }
}