package com.example.teamdev.controller.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.teamdev.config.SecurityConfig;
import com.example.teamdev.dto.api.home.HomeNewsItem;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.service.HomeNewsService;
import com.example.teamdev.service.StampService;
import com.example.teamdev.util.SecurityUtil;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;

import com.example.teamdev.mapper.EmployeeMapper;

@WebMvcTest(controllers = HomeRestController.class)
@Import({SecurityConfig.class, SecurityUtil.class})
@ActiveProfiles("test")
@TestPropertySource(properties = "app.environment=test")
@Tag("api")
class HomeRestControllerTest {

    private static final String ADMIN_EMAIL = "admin.user@example.com";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private HomeNewsService homeNewsService;

    @MockitoBean
    private StampService stampService;

    @MockitoBean
    private EmployeeMapper employeeMapper;

    @BeforeEach
    void stubEmployee() {
        Employee employee = new Employee(
            100,
            "管理",
            "者",
            ADMIN_EMAIL,
            "encoded",
            1,
            Timestamp.from(Instant.parse("2025-01-01T00:00:00Z"))
        );
        when(employeeMapper.getEmployeeByEmail(ADMIN_EMAIL)).thenReturn(employee);
    }

    @DisplayName("/api/home/overview は releaseFlag フィールドを提供するべき")
    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void overviewShouldExposeReleaseFlagField() throws Exception {
        when(homeNewsService.execute()).thenReturn(List.of(
            new HomeNewsItem(
                1,
                "メンテナンスのお知らせ",
                "2025/10/10",
                true
            )
        ));

        mockMvc.perform(get("/api/home/overview").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.news[0].releaseFlag").value(true))
            .andExpect(jsonPath("$.news[0].released").doesNotExist());
    }
}
