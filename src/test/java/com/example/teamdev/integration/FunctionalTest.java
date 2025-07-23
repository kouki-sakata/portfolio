package com.example.teamdev.integration;

import com.example.teamdev.dto.DataTablesRequest;
import com.example.teamdev.dto.Search;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * DataTablesとログアウト機能の動作確認テスト
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class FunctionalTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"ADMIN"})
    public void testEmployeeDataTablesWithNullSafeHandling() throws Exception {
        // DataTablesRequestの最小限の構成でテスト
        DataTablesRequest request = new DataTablesRequest();
        request.setDraw(1);
        request.setStart(0);
        request.setLength(10);
        
        // Searchオブジェクトは設定するが、OrderとColumnsはnullのまま
        Search search = new Search();
        search.setValue("");
        search.setRegex(false);
        request.setSearch(search);

        String requestJson = objectMapper.writeValueAsString(request);

        mockMvc.perform(post("/employeemanage/data")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.draw").value(1))
                .andExpect(jsonPath("$.recordsTotal").exists())
                .andExpect(jsonPath("$.recordsFiltered").exists())
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"ADMIN"})
    public void testLogoutEndpointExists() throws Exception {
        mockMvc.perform(post("/logout")
                .with(csrf()))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/signin?logout=true"));
    }

    @Test
    public void testSigninPageShowsLogoutMessage() throws Exception {
        mockMvc.perform(get("/signin?logout=true"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("ログアウトしました")));
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"USER"})
    public void testStampHistoryWorksAfterFix() throws Exception {
        mockMvc.perform(post("/stamphistory/init"))
                .andExpect(status().isOk())
                .andExpect(view().name("./stamphistory/stamp-history"))
                .andExpect(model().attributeExists("stampHistoryList"));
    }
}