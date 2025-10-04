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
class ModernUiOnlyIntegrationTest extends PostgresContainerSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    void legacyMvcControllersAreNotRegistered() {
        assertThat(applicationContext.containsBean("signInController")).isFalse();
        assertThat(applicationContext.containsBean("employeeManageController")).isFalse();
        assertThat(applicationContext.containsBean("webMvcConfig")).isTrue();
    }

    @Test
    void featureFlagEndpointAlwaysEnablesModernUi() throws Exception {
        mockMvc.perform(get("/api/public/feature-flags"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.useShadcnUI").value(true));
    }
}
