package com.example.teamdev.controller.api;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.teamdev.config.SecurityConfig;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.entity.StampHistory;
import com.example.teamdev.mapper.EmployeeMapper;
import com.example.teamdev.mapper.StampHistoryMapper;
import com.example.teamdev.service.StampDeleteService;
import com.example.teamdev.service.StampEditService;
import com.example.teamdev.util.SecurityUtil;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = StampRestController.class)
@Import({SecurityConfig.class, SecurityUtil.class})
@ActiveProfiles("test")
@TestPropertySource(properties = "app.environment=test")
@Tag("api")
class StampRestControllerTest {

    private static final String EMPLOYEE_EMAIL = "employee@example.com";
    private static final String ADMIN_EMAIL = "admin@example.com";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StampEditService stampEditService;

    @MockBean
    private StampDeleteService stampDeleteService;

    @MockBean
    private StampHistoryMapper stampHistoryMapper;

    @MockBean
    private EmployeeMapper employeeMapper;

    @BeforeEach
    void setUpEmployeeMapper() {
        Employee employee = new Employee(
            10,
            "一般",
            "従業員",
            EMPLOYEE_EMAIL,
            "encoded",
            0,
            Timestamp.from(Instant.parse("2025-01-01T00:00:00Z"))
        );
        Employee admin = new Employee(
            1,
            "管理",
            "者",
            ADMIN_EMAIL,
            "encoded",
            1,
            Timestamp.from(Instant.parse("2025-01-01T00:00:00Z"))
        );

        when(employeeMapper.getEmployeeByEmail(EMPLOYEE_EMAIL)).thenReturn(employee);
        when(employeeMapper.getEmployeeByEmail(ADMIN_EMAIL)).thenReturn(admin);
    }

    @DisplayName("PUT /api/stamps/{id} は所有者の更新を StampEditService に委譲する")
    @Test
    @WithMockUser(username = EMPLOYEE_EMAIL)
    void updateStampShouldDelegateToService() throws Exception {
        OffsetDateTime inTime = OffsetDateTime.of(2025, 10, 2, 9, 0, 0, 0, ZoneOffset.ofHours(9));
        OffsetDateTime outTime = OffsetDateTime.of(2025, 10, 2, 18, 0, 0, 0, ZoneOffset.ofHours(9));
        StampHistory history = new StampHistory(
            99,
            "2025",
            "10",
            "02",
            10,
            inTime,
            outTime,
            null,
            null,
            null,
            10,
            OffsetDateTime.now(ZoneOffset.UTC)
        );
        when(stampHistoryMapper.getById(99)).thenReturn(Optional.of(history));

        mockMvc.perform(
            put("/api/stamps/{id}", 99)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "outTime": "19:00"
                    }
                    """)
        ).andExpect(status().isNoContent());

        ArgumentCaptor<List<Map<String, Object>>> payloadCaptor = ArgumentCaptor.forClass(List.class);
        verify(stampEditService).execute(payloadCaptor.capture(), eq(10));

        List<Map<String, Object>> captured = payloadCaptor.getValue();
        Map<String, Object> first = captured.getFirst();
        // 既存の出勤時刻は維持される
        org.assertj.core.api.Assertions.assertThat(first)
            .containsEntry("id", "99")
            .containsEntry("employeeId", "10")
            .containsEntry("year", "2025")
            .containsEntry("month", "10")
            .containsEntry("day", "02")
            .containsEntry("inTime", "09:00")
            .containsEntry("outTime", "19:00");
    }

    @DisplayName("PUT /api/stamps/{id} は他人の打刻を一般権限から更新できない")
    @Test
    @WithMockUser(username = EMPLOYEE_EMAIL)
    void updateStampShouldReturnForbiddenWhenNotOwner() throws Exception {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        StampHistory history = new StampHistory(
            55,
            "2025",
            "11",
            "01",
            999,
            now,
            null,
            null,
            null,
            null,
            999,
            now
        );
        when(stampHistoryMapper.getById(55)).thenReturn(Optional.of(history));

        mockMvc.perform(
            put("/api/stamps/{id}", 55)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "inTime": "09:00"
                    }
                    """)
        ).andExpect(status().isForbidden());

        verifyNoInteractions(stampEditService);
    }

    @DisplayName("PUT /api/stamps/{id} は存在しないIDなら404を返す")
    @Test
    @WithMockUser(username = EMPLOYEE_EMAIL)
    void updateStampShouldReturnNotFoundWhenMissing() throws Exception {
        when(stampHistoryMapper.getById(777)).thenReturn(Optional.empty());

        mockMvc.perform(
            put("/api/stamps/{id}", 777)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "inTime": "10:00"
                    }
                    """)
        ).andExpect(status().isNotFound());

        verifyNoInteractions(stampEditService);
    }

    @DisplayName("DELETE /api/stamps/{id} は削除成功時に204を返す")
    @Test
    @WithMockUser(username = EMPLOYEE_EMAIL)
    void deleteStampShouldReturnNoContent() throws Exception {
        StampHistory history = new StampHistory(
            200,
            "2025",
            "09",
            "30",
            10,
            null,
            null,
            null,
            null,
            null,
            10,
            OffsetDateTime.now(ZoneOffset.UTC)
        );
        when(stampHistoryMapper.getById(200)).thenReturn(Optional.of(history));
        when(stampDeleteService.deleteStampById(200, 10)).thenReturn(true);

        mockMvc.perform(
            delete("/api/stamps/{id}", 200)
                .with(csrf())
        ).andExpect(status().isNoContent());

        verify(stampDeleteService, times(1)).deleteStampById(200, 10);
    }

    @DisplayName("DELETE /api/stamps/{id} は認証されていなければ401を返す")
    @Test
    void deleteStampShouldRequireAuthentication() throws Exception {
        mockMvc.perform(
            delete("/api/stamps/{id}", 300)
                .with(csrf())
        ).andExpect(status().isUnauthorized());
    }

    // ========================================
    // 改修箇所の統合テスト
    // ========================================

    @DisplayName("PUT /api/stamps/{id} は空文字列で休憩時間を削除できる【OK】")
    @Test
    @WithMockUser(username = EMPLOYEE_EMAIL)
    void updateStampShouldDeleteBreakTimeWithEmptyString() throws Exception {
        OffsetDateTime inTime = OffsetDateTime.of(2025, 10, 15, 9, 0, 0, 0, ZoneOffset.ofHours(9));
        OffsetDateTime outTime = OffsetDateTime.of(2025, 10, 15, 18, 0, 0, 0, ZoneOffset.ofHours(9));
        OffsetDateTime breakStart = OffsetDateTime.of(2025, 10, 15, 12, 0, 0, 0, ZoneOffset.ofHours(9));
        OffsetDateTime breakEnd = OffsetDateTime.of(2025, 10, 15, 13, 0, 0, 0, ZoneOffset.ofHours(9));

        StampHistory history = new StampHistory(
            150,
            "2025",
            "10",
            "15",
            10,
            inTime,
            outTime,
            breakStart,
            breakEnd,
            null,
            10,
            OffsetDateTime.now(ZoneOffset.UTC)
        );
        when(stampHistoryMapper.getById(150)).thenReturn(Optional.of(history));

        mockMvc.perform(
            put("/api/stamps/{id}", 150)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "breakStartTime": "",
                      "breakEndTime": ""
                    }
                    """)
        ).andExpect(status().isNoContent());

        ArgumentCaptor<List<Map<String, Object>>> payloadCaptor = ArgumentCaptor.forClass(List.class);
        verify(stampEditService).execute(payloadCaptor.capture(), eq(10));

        List<Map<String, Object>> captured = payloadCaptor.getValue();
        Map<String, Object> first = captured.getFirst();

        // 休憩時間がnullになっていることを確認（削除）
        org.assertj.core.api.Assertions.assertThat(first)
            .containsEntry("breakStartTime", null)
            .containsEntry("breakEndTime", null)
            .containsEntry("inTime", "09:00")
            .containsEntry("outTime", "18:00");
    }

    @DisplayName("PUT /api/stamps/{id} は夜勤フラグと休憩時間を同時に更新できる【OK】")
    @Test
    @WithMockUser(username = EMPLOYEE_EMAIL)
    void updateStampShouldUpdateNightShiftFlagAndBreakTime() throws Exception {
        OffsetDateTime inTime = OffsetDateTime.of(2025, 10, 20, 22, 0, 0, 0, ZoneOffset.ofHours(9));
        OffsetDateTime outTime = OffsetDateTime.of(2025, 10, 21, 6, 0, 0, 0, ZoneOffset.ofHours(9));

        StampHistory history = new StampHistory(
            160,
            "2025",
            "10",
            "20",
            10,
            inTime,
            outTime,
            null,
            null,
            false,
            10,
            OffsetDateTime.now(ZoneOffset.UTC)
        );
        when(stampHistoryMapper.getById(160)).thenReturn(Optional.of(history));

        mockMvc.perform(
            put("/api/stamps/{id}", 160)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "breakStartTime": "01:00",
                      "breakEndTime": "02:00",
                      "isNightShift": true
                    }
                    """)
        ).andExpect(status().isNoContent());

        ArgumentCaptor<List<Map<String, Object>>> payloadCaptor = ArgumentCaptor.forClass(List.class);
        verify(stampEditService).execute(payloadCaptor.capture(), eq(10));

        List<Map<String, Object>> captured = payloadCaptor.getValue();
        Map<String, Object> first = captured.getFirst();

        // 休憩時間と夜勤フラグが更新されることを確認
        org.assertj.core.api.Assertions.assertThat(first)
            .containsEntry("breakStartTime", "01:00")
            .containsEntry("breakEndTime", "02:00")
            .containsEntry("isNightShift", true);
    }

    @DisplayName("PUT /api/stamps/{id} は休憩終了時刻が開始時刻より前だと400エラーを返す【NG】")
    @Test
    @WithMockUser(username = EMPLOYEE_EMAIL)
    void updateStampShouldReturnBadRequestWhenBreakEndBeforeStart() throws Exception {
        OffsetDateTime inTime = OffsetDateTime.of(2025, 10, 25, 9, 0, 0, 0, ZoneOffset.ofHours(9));
        OffsetDateTime outTime = OffsetDateTime.of(2025, 10, 25, 18, 0, 0, 0, ZoneOffset.ofHours(9));

        StampHistory history = new StampHistory(
            170,
            "2025",
            "10",
            "25",
            10,
            inTime,
            outTime,
            null,
            null,
            null,
            10,
            OffsetDateTime.now(ZoneOffset.UTC)
        );
        when(stampHistoryMapper.getById(170)).thenReturn(Optional.of(history));

        // 休憩終了時刻（11:00）が休憩開始時刻（13:00）より前
        mockMvc.perform(
            put("/api/stamps/{id}", 170)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "breakStartTime": "13:00",
                      "breakEndTime": "11:00"
                    }
                    """)
        ).andExpect(status().isBadRequest());

        // サービスが呼ばれないことを確認
        verifyNoInteractions(stampEditService);
    }

    @DisplayName("PUT /api/stamps/{id} はすべてのフィールドが空だと400エラーを返す【NG】")
    @Test
    @WithMockUser(username = EMPLOYEE_EMAIL)
    void updateStampShouldReturnBadRequestWhenAllFieldsEmpty() throws Exception {
        OffsetDateTime inTime = OffsetDateTime.of(2025, 10, 30, 9, 0, 0, 0, ZoneOffset.ofHours(9));
        OffsetDateTime outTime = OffsetDateTime.of(2025, 10, 30, 18, 0, 0, 0, ZoneOffset.ofHours(9));

        StampHistory history = new StampHistory(
            180,
            "2025",
            "10",
            "30",
            10,
            inTime,
            outTime,
            null,
            null,
            null,
            10,
            OffsetDateTime.now(ZoneOffset.UTC)
        );
        when(stampHistoryMapper.getById(180)).thenReturn(Optional.of(history));

        // すべてのフィールドが空またはnull
        mockMvc.perform(
            put("/api/stamps/{id}", 180)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "inTime": "",
                      "outTime": ""
                    }
                    """)
        ).andExpect(status().isBadRequest());

        // サービスが呼ばれないことを確認
        verifyNoInteractions(stampEditService);
    }
}
