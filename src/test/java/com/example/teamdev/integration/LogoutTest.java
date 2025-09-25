package com.example.teamdev.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import com.example.teamdev.testconfig.PostgresContainerSupport;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * ログアウトフローのテスト（SPA構成対応）
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LogoutTest extends PostgresContainerSupport {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"USER"})
    void testHomeRouteForwardsToSpa() throws Exception {
        mockMvc.perform(get("/home/init"))
            .andExpect(status().isOk())
            .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"USER"})
    void testLogoutFunctionality() throws Exception {
        mockMvc.perform(post("/api/auth/logout").with(csrf()))
            .andExpect(status().isNoContent());
    }

    @Test
    void testLogoutWithoutAuthentication() throws Exception {
        mockMvc.perform(post("/api/auth/logout").with(csrf()))
            .andExpect(status().isNoContent());
    }
}
