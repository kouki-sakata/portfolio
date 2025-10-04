package com.example.teamdev.integration;

import com.example.teamdev.testconfig.PostgresContainerSupport;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"test", "modern-ui"})
class ModernUiProfileIntegrationTest extends PostgresContainerSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    @WithMockUser(username = "modern@test", roles = {"USER"})
    void spaRoutesForwardToIndex() throws Exception {
        mockMvc.perform(get("/home/init"))
            .andExpect(status().isOk())
            .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    void featureFlagEndpointReturnsModernFlags() throws Exception {
        mockMvc.perform(get("/api/public/feature-flags"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.useShadcnUI").value(true));
    }

    @Test
    void webMvcConfigBeanIsPresentInModernProfile() {
        assertThat(applicationContext.containsBean("webMvcConfig")).isTrue();
    }
}
