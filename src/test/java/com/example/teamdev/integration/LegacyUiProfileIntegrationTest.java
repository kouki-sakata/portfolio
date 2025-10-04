package com.example.teamdev.integration;

import com.example.teamdev.testconfig.PostgresContainerSupport;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"test", "legacy-ui"})
class LegacyUiProfileIntegrationTest extends PostgresContainerSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    void legacyUiControllersAreLoaded() {
        assertThat(applicationContext.containsBean("signInController")).isTrue();
        assertThat(applicationContext.containsBean("webMvcConfig")).isFalse();
    }

    @Test
    void featureFlagEndpointReturnsLegacyFlags() throws Exception {
        mockMvc.perform(get("/api/public/feature-flags"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.useShadcnUI").value(false));
    }
}
