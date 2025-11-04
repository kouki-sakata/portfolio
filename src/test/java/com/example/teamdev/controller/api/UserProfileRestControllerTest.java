package com.example.teamdev.controller.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.teamdev.config.SecurityConfig;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.mapper.EmployeeMapper;
import com.example.teamdev.service.profile.ProfileAppService;
import com.example.teamdev.service.profile.model.ProfileActivityEntry;
import com.example.teamdev.service.profile.model.ProfileActivityPage;
import com.example.teamdev.service.profile.model.ProfileAggregate;
import com.example.teamdev.service.profile.model.ProfileEmployeeSummary;
import com.example.teamdev.service.profile.model.ProfileMetadataDocument;
import com.example.teamdev.service.profile.model.ProfileMetadataUpdateCommand;
import com.example.teamdev.service.profile.model.ProfileWorkScheduleDocument;
import com.example.teamdev.util.SecurityUtil;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

@WebMvcTest(controllers = UserProfileRestController.class)
@Import({SecurityConfig.class, SecurityUtil.class})
@ActiveProfiles("test")
@TestPropertySource(properties = "app.environment=test")
@Tag("api")
class UserProfileRestControllerTest {

    private static final String EMPLOYEE_EMAIL = "profile@example.com";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProfileAppService profileAppService;

    @MockBean
    private EmployeeMapper employeeMapper;

    @Captor
    private ArgumentCaptor<ProfileMetadataUpdateCommand> commandCaptor;

    @BeforeEach
    void setUpEmployeeMapper() {
        Employee employee = new Employee(
            9000,
            "従業員",
            "太郎",
            EMPLOYEE_EMAIL,
            "encoded",
            0,
            Timestamp.from(Instant.parse("2025-01-01T00:00:00Z"))
        );
        when(employeeMapper.getEmployeeByEmail(EMPLOYEE_EMAIL)).thenReturn(employee);
    }

    @DisplayName("GET /api/profile/me は自身のプロフィール集約を返す")
    @Test
    @WithMockUser(username = EMPLOYEE_EMAIL)
    void getSelfProfileReturnsAggregate() throws Exception {
        ProfileAggregate aggregate = new ProfileAggregate(
            new ProfileEmployeeSummary(9000, "従業員 太郎", EMPLOYEE_EMAIL, false, "2025-11-01T00:00:00Z"),
            new ProfileMetadataDocument(
                "東京都",
                "開発部",
                "EMP-9000",
                "頑張っています",
                "東京/丸の内",
                "上長 一郎",
                "hybrid",
                new ProfileWorkScheduleDocument("09:30", "18:30", 60),
                "active",
                "2024-04-01",
                ""
            )
        );
        when(profileAppService.loadSelfProfile(9000)).thenReturn(aggregate);

        mockMvc.perform(get("/api/profile/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.employee.id").value(9000))
            .andExpect(jsonPath("$.employee.fullName").value("従業員 太郎"))
            .andExpect(jsonPath("$.metadata.department").value("開発部"))
            .andExpect(jsonPath("$.metadata.schedule.start").value("09:30"));

        verify(profileAppService).loadSelfProfile(9000);
        verifyNoMoreInteractions(profileAppService);
    }

    @DisplayName("PATCH /api/profile/me/metadata は更新コマンドをサービスへ渡す")
    @Test
    @WithMockUser(username = EMPLOYEE_EMAIL)
    void patchSelfMetadataDelegatesToService() throws Exception {
        ProfileAggregate updated = new ProfileAggregate(
            new ProfileEmployeeSummary(9000, "従業員 太郎", EMPLOYEE_EMAIL, false, "2025-11-01T00:10:00Z"),
            new ProfileMetadataDocument(
                "大阪府",
                "DX推進室",
                "EMP-9000",
                "新しい活動メモ",
                "大阪/梅田",
                "部長 花子",
                "remote",
                new ProfileWorkScheduleDocument("10:00", "19:00", 45),
                "active",
                "2024-04-01",
                ""
            )
        );
        when(profileAppService.updateMetadata(eq(9000), eq(9000), any(ProfileMetadataUpdateCommand.class)))
            .thenReturn(updated);

        MvcResult result = mockMvc.perform(
                patch("/api/profile/me/metadata")
                    .with(csrf())
                    .contentType("application/json")
                    .content("""
                        {
                          "address": "大阪府",
                          "department": "DX推進室",
                          "employeeNumber": "EMP-9000",
                          "activityNote": "新しい活動メモ",
                          "location": "大阪/梅田",
                          "manager": "部長 花子",
                          "workStyle": "remote",
                          "scheduleStart": "10:00",
                          "scheduleEnd": "19:00",
                          "scheduleBreakMinutes": 45,
                          "status": "active"
                        }
                        """
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.metadata.address").value("大阪府"))
            .andReturn();

        verify(profileAppService).updateMetadata(eq(9000), eq(9000), commandCaptor.capture());
        ProfileMetadataUpdateCommand captured = commandCaptor.getValue();
        assertThat(captured.address()).isEqualTo("大阪府");
        assertThat(captured.schedule().start()).isEqualTo("10:00");
        assertThat(captured.schedule().breakMinutes()).isEqualTo(45);
    }

    @DisplayName("GET /api/profile/me/activity はページングされた活動履歴を返す")
    @Test
    @WithMockUser(username = EMPLOYEE_EMAIL)
    void getSelfActivityReturnsPage() throws Exception {
        ProfileActivityPage page = new ProfileActivityPage(
            0,
            20,
            1,
            1,
            List.of(
                new ProfileActivityEntry(
                    "evt-1",
                    "2025-11-04T09:00:00Z",
                    "従業員 太郎",
                    "UPDATE",
                    "住所を更新",
                    List.of("address"),
                    java.util.Map.of("address", "旧住所"),
                    java.util.Map.of("address", "新住所")
                )
            )
        );
        when(profileAppService.listActivities(eq(9000), eq(9000), any())).thenReturn(page);

        mockMvc.perform(get("/api/profile/me/activity").param("page", "0").param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items[0].operationType").value("UPDATE"))
            .andExpect(jsonPath("$.items[0].changedFields[0]").value("address"));

        verify(profileAppService).listActivities(eq(9000), eq(9000), any());
    }
}
