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
 * ログアウト機能のテスト
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class LogoutTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"USER"})
    public void testHomePageContainsLogoutButton() throws Exception {
        mockMvc.perform(get("/home/init"))
                .andExpect(status().isOk())
                .andExpect(view().name("./home/home"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("サインアウト")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("logout-form")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("performLogout")));
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"USER"})
    public void testLogoutFunctionality() throws Exception {
        mockMvc.perform(post("/logout")
                .with(csrf()))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/signin?logout=true"));
    }

    @Test
    public void testLogoutWithoutAuthentication() throws Exception {
        mockMvc.perform(post("/logout")
                .with(csrf()))
                .andExpect(status().is3xxRedirection());
    }
}