package com.example.teamdev.integration;

import com.example.teamdev.config.SecurityConfig;
import com.example.teamdev.service.CustomUserDetailsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Spring Security認証フローの統合テスト
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthenticationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testUnauthenticatedAccessRedirectsToSignin() throws Exception {
        mockMvc.perform(get("/home/init"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrlPattern("**/signin"));
    }

    @Test 
    public void testSigninPageAccessible() throws Exception {
        mockMvc.perform(get("/signin"))
                .andExpect(status().isOk())
                .andExpect(view().name("./signin/signin"));
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"ADMIN"})
    public void testAdminAccessToEmployeeManagement() throws Exception {
        mockMvc.perform(get("/employeemanage/init"))
                .andExpect(status().isOk())
                .andExpect(view().name("./employeemanage/employee-manage"));
    }

    @Test
    @WithMockUser(username = "user@test.com", roles = {"USER"})
    public void testUserAccessToEmployeeManagementDenied() throws Exception {
        mockMvc.perform(get("/employeemanage/init"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"ADMIN"})
    public void testAdminAccessToNewsManagement() throws Exception {
        mockMvc.perform(get("/newsmanage/init"))
                .andExpect(status().isOk())
                .andExpect(view().name("./newsmanage/news-manage"));
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"USER"})
    public void testUserAccessToHomeAllowed() throws Exception {
        mockMvc.perform(get("/home/init"))
                .andExpect(status().isOk())
                .andExpect(view().name("./home/home"));
    }
}