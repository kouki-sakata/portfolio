package com.example.teamdev.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * ナビゲーションボタンのCSRF保護テスト
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class NavigationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"USER"})
    public void testHomeNavigationWithCSRF() throws Exception {
        mockMvc.perform(post("/home/init")
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(view().name("./home/home"));
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"USER"})
    public void testStampHistoryNavigationWithCSRF() throws Exception {
        mockMvc.perform(post("/stamphistory/init")
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(view().name("./stamphistory/stamp-history"));
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"USER"})
    public void testEmployeeListNavigationWithCSRF() throws Exception {
        mockMvc.perform(post("/employeelist/init")
                .with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"ADMIN"})
    public void testAdminNavigationWithCSRF() throws Exception {
        mockMvc.perform(post("/employeemanage/init")
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(view().name("./employeemanage/employee-manage"));
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"USER"})
    public void testNavigationWithoutCSRF_ShouldFail() throws Exception {
        // CSRF なしでリクエスト - 403 Forbidden になるはず
        mockMvc.perform(post("/home/init"))
                .andExpect(status().isForbidden());
    }
}