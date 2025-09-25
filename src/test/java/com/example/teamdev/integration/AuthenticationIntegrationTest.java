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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrlPattern;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Spring Security認証フローの統合テスト（SPA構成対応）
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthenticationIntegrationTest extends PostgresContainerSupport {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testUnauthenticatedAccessRedirectsToSignin() throws Exception {
        mockMvc.perform(get("/home/init"))
            .andExpect(status().is3xxRedirection())
            .andExpect(redirectedUrlPattern("**/signin"));
    }

    @Test
    void testSigninRouteForwardsToSpaEntryPoint() throws Exception {
        mockMvc.perform(get("/signin"))
            .andExpect(status().isOk())
            .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"ADMIN"})
    void testAdminAccessToEmployeeManagementForwardsToSpa() throws Exception {
        mockMvc.perform(get("/employeemanage/init"))
            .andExpect(status().isOk())
            .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    @WithMockUser(username = "user@test.com", roles = {"USER"})
    void testUserAccessToEmployeeManagementDenied() throws Exception {
        mockMvc.perform(get("/employeemanage/init"))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"ADMIN"})
    void testAdminAccessToNewsManagementForwardsToSpa() throws Exception {
        mockMvc.perform(get("/newsmanage/init"))
            .andExpect(status().isOk())
            .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"USER"})
    void testUserAccessToHomeForwardsToSpa() throws Exception {
        mockMvc.perform(get("/home/init"))
            .andExpect(status().isOk())
            .andExpect(forwardedUrl("/index.html"));
    }
}
