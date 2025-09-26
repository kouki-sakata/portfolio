package com.example.teamdev.integration;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("api")
class HomeSecurityContractTest extends com.example.teamdev.testconfig.PostgresContainerSupport {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void overview_requires_authentication() throws Exception {
        mockMvc.perform(get("/api/home/overview"))
            .andExpect(result -> assertThat(result.getResponse().getStatus()).isIn(401, 302));
    }

    @Test
    void stamps_without_csrf_is_forbidden() throws Exception {
        mockMvc.perform(post("/api/home/stamps")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"stampType\":\"ATTENDANCE\",\"stampTime\":\"2025-01-01T09:00:00\",\"nightWorkFlag\":\"0\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void stamp_history_requires_authentication() throws Exception {
        mockMvc.perform(get("/api/stamp-history"))
            .andExpect(result -> assertThat(result.getResponse().getStatus()).isIn(401, 302));
    }
}

