package com.example.teamdev.controller.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.doThrow;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.teamdev.config.SecurityConfig;
import com.example.teamdev.dto.api.home.HomeNewsItem;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.service.HomeNewsService;
import com.example.teamdev.service.HomeAttendanceService;
import com.example.teamdev.service.dto.DailyAttendanceSnapshot;
import com.example.teamdev.service.dto.AttendanceStatus;
import java.util.Optional;
import com.example.teamdev.service.StampService;
import com.example.teamdev.exception.DuplicateStampException;
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
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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

    @MockBean
    private HomeNewsService homeNewsService;

    @MockBean
    private StampService stampService;

    @MockBean
    private HomeAttendanceService homeAttendanceService;

    @MockBean
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

    @DisplayName("POST /api/home/breaks/toggle は重複時に409とメッセージを返す")
    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void toggleBreakShouldReturnConflictWhenDuplicate() throws Exception {
        doThrow(new DuplicateStampException("休憩", "2025-11-07T12:00:00Z"))
            .when(stampService).toggleBreak(eq(100), any());

        String body = "{" +
            "\"timestamp\":\"2025-11-07T12:00:00+09:00\"" +
            "}";

        mockMvc.perform(post("/api/home/breaks/toggle")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isConflict())
            .andExpect(result -> assertEquals(
                "休憩操作は既に登録されています。画面を再読み込みして最新の勤怠状況を確認してください。",
                result.getResponse().getErrorMessage()
            ));
    }

    @DisplayName("/api/home/overview は releaseFlag フィールドを提供するべき")
    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void overviewShouldExposeReleaseFlagField() throws Exception {
        when(homeNewsService.execute()).thenReturn(List.of(
            new HomeNewsItem(
                1,
                "メンテナンスのお知らせ",
                "システムメンテナンスを実施します",
                "SYSTEM",
                "2025/10/10",
                true
            )
        ));
        when(homeAttendanceService.fetchTodaySnapshot(eq(100), any()))
            .thenReturn(Optional.of(new DailyAttendanceSnapshot(
                AttendanceStatus.WORKING,
                "2025-11-07T09:00:00+09:00",
                null,
                null,
                null,
                0
            )));

        mockMvc.perform(get("/api/home/overview").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.news[0].title").value("メンテナンスのお知らせ"))
            .andExpect(jsonPath("$.news[0].label").value("SYSTEM"))
            .andExpect(jsonPath("$.news[0].releaseFlag").value(true))
            .andExpect(jsonPath("$.news[0].released").doesNotExist())
            .andExpect(jsonPath("$.attendance.status").value("WORKING"))
            .andExpect(jsonPath("$.attendance.attendanceTime").value("2025-11-07T09:00:00+09:00"));
    }
}
