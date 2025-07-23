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
 * DataTablesエンドポイントの結合テスト
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class DataTablesIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"ADMIN"})
    public void testEmployeeManagePageLoads() throws Exception {
        mockMvc.perform(get("/employeemanage/init"))
                .andExpect(status().isOk())
                .andExpect(view().name("./employeemanage/employee-manage"))
                .andExpect(model().attributeExists("adminFlag"))
                .andExpect(model().attributeExists("employeeName"));
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"ADMIN"})
    public void testEmployeeDataTablesEndpoint() throws Exception {
        DataTablesRequest request = new DataTablesRequest();
        request.setDraw(1);
        request.setStart(0);
        request.setLength(10);
        
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
    @WithMockUser(username = "user@test.com", roles = {"USER"})
    public void testEmployeeDataTablesAccessDeniedForUser() throws Exception {
        DataTablesRequest request = new DataTablesRequest();
        request.setDraw(1);
        request.setStart(0);
        request.setLength(10);
        
        Search search = new Search();
        search.setValue("");
        search.setRegex(false);
        request.setSearch(search);

        String requestJson = objectMapper.writeValueAsString(request);

        mockMvc.perform(post("/employeemanage/data")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestJson))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"USER"})
    public void testStampHistoryPageLoads() throws Exception {
        mockMvc.perform(post("/stamphistory/init"))
                .andExpect(status().isOk())
                .andExpect(view().name("./stamphistory/stamp-history"))
                .andExpect(model().attributeExists("stampHistoryList"))
                .andExpect(model().attributeExists("yearList"))
                .andExpect(model().attributeExists("monthList"));
    }

    @Test
    public void testUnauthenticatedDataTablesAccess() throws Exception {
        DataTablesRequest request = new DataTablesRequest();
        Search search = new Search();
        search.setValue("");
        request.setSearch(search);
        String requestJson = objectMapper.writeValueAsString(request);

        mockMvc.perform(post("/employeemanage/data")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestJson))
                .andExpect(status().is3xxRedirection());
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"ADMIN"})
    public void testCSRFProtectionOnDataTablesEndpoint() throws Exception {
        DataTablesRequest request = new DataTablesRequest();
        request.setDraw(1);
        Search search = new Search();
        search.setValue("");
        request.setSearch(search);
        String requestJson = objectMapper.writeValueAsString(request);

        // CSRF トークンなしでリクエスト
        mockMvc.perform(post("/employeemanage/data")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestJson))
                .andExpect(status().isForbidden());
    }
}