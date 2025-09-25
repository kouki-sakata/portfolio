package com.example.teamdev.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import com.example.teamdev.testconfig.PostgresContainerSupport;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * SPAナビゲーションルートのフォワード挙動と権限制御のテスト
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NavigationTest extends PostgresContainerSupport {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"USER"})
    void testHomeNavigationForwardsToSpa() throws Exception {
        mockMvc.perform(get("/home/init"))
            .andExpect(status().isOk())
            .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"USER"})
    void testStampHistoryNavigationForwardsToSpa() throws Exception {
        mockMvc.perform(get("/stamphistory/init"))
            .andExpect(status().isOk())
            .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"USER"})
    void testEmployeeListNavigationForwardsToSpa() throws Exception {
        mockMvc.perform(get("/employeelist/init"))
            .andExpect(status().isOk())
            .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"ADMIN"})
    void testAdminNavigationForwardsToSpa() throws Exception {
        mockMvc.perform(get("/employeemanage/init"))
            .andExpect(status().isOk())
            .andExpect(forwardedUrl("/index.html"));
    }
}
