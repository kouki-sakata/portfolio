package com.example.teamdev.controller.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.teamdev.config.SecurityConfig;
import com.example.teamdev.dto.api.stamprequest.StampRequestBulkOperationResponse;
import com.example.teamdev.dto.api.stamprequest.StampRequestCreateRequest;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.entity.StampRequest;
import com.example.teamdev.mapper.EmployeeMapper;
import com.example.teamdev.service.StampRequestApprovalService;
import com.example.teamdev.service.StampRequestBulkOperationService;
import com.example.teamdev.service.StampRequestCancellationService;
import com.example.teamdev.service.StampRequestQueryService;
import com.example.teamdev.service.StampRequestRegistrationService;
import com.example.teamdev.util.SecurityUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@WebMvcTest(controllers = StampRequestRestController.class)
@Import({SecurityConfig.class, SecurityUtil.class})
@ActiveProfiles("test")
@TestPropertySource(properties = "app.environment=test")
@Tag("api")
class StampRequestRestControllerTest {

    private static final String EMPLOYEE_EMAIL = "employee@example.com";
    private static final String ADMIN_EMAIL = "admin@example.com";

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockitoBean
    StampRequestQueryService queryService;

    @MockitoBean
    StampRequestRegistrationService registrationService;

    @MockitoBean
    StampRequestApprovalService approvalService;

    @MockitoBean
    StampRequestCancellationService cancellationService;

    @MockitoBean
    StampRequestBulkOperationService bulkOperationService;

    @MockitoBean
    EmployeeMapper employeeMapper;

    private Employee employee;
    private Employee admin;

    @BeforeEach
    void setUpEmployees() {
        employee = new Employee(18, "太郎", "山田", EMPLOYEE_EMAIL, "encoded", 0, Timestamp.from(Instant.parse("2025-01-01T00:00:00Z")));
        admin = new Employee(101, "一郎", "管理者", ADMIN_EMAIL, "encoded", 1, Timestamp.from(Instant.parse("2025-01-01T00:00:00Z")));
        when(employeeMapper.getEmployeeByEmail(EMPLOYEE_EMAIL)).thenReturn(employee);
        when(employeeMapper.getEmployeeByEmail(ADMIN_EMAIL)).thenReturn(admin);
        when(employeeMapper.getById(employee.getId())).thenReturn(Optional.of(employee));
        when(employeeMapper.getById(admin.getId())).thenReturn(Optional.of(admin));
    }

    @Test
    @DisplayName("POST /api/stamp-requests returns created payload for authenticated employee")
    @WithMockUser(username = EMPLOYEE_EMAIL, roles = "USER")
    void createRequestReturnsCreatedPayload() throws Exception {
        StampRequest saved = buildRequest(900, employee.getId());
        when(registrationService.createRequest(any(StampRequestCreateRequest.class), eq(employee.getId())))
            .thenReturn(saved);

        Map<String, Object> payload = Map.of(
            "stampHistoryId", 321,
            "reason", "退勤漏れのため修正します。"
        );

        mockMvc.perform(post("/api/stamp-requests")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(900))
            .andExpect(jsonPath("$.status").value("PENDING"))
            .andExpect(jsonPath("$.employeeName").value("太郎 山田"));

        verify(registrationService)
            .createRequest(any(StampRequestCreateRequest.class), eq(employee.getId()));
    }

    @Test
    @DisplayName("GET /api/stamp-requests/my-requests requires authentication")
    void myRequestsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/stamp-requests/my-requests"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/stamp-requests/my-requests returns paginated data for employee")
    @WithMockUser(username = EMPLOYEE_EMAIL, roles = "USER")
    void myRequestsReturnPayload() throws Exception {
        StampRequest pending = buildRequest(910, employee.getId());
        when(queryService.getEmployeeRequests(eq(employee.getId()), eq("PENDING"), eq(0), eq(20)))
            .thenReturn(List.of(pending));
        when(queryService.countEmployeeRequests(employee.getId(), "PENDING")).thenReturn(1);

        mockMvc.perform(get("/api/stamp-requests/my-requests")
                .param("status", "PENDING")
                .param("page", "0")
                .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.requests[0].id").value(910))
            .andExpect(jsonPath("$.requests[0].status").value("PENDING"))
            .andExpect(jsonPath("$.requests[0].submittedTimestamp").value(
                pending.getCreatedAt().toInstant().toEpochMilli()
            ))
            .andExpect(jsonPath("$.totalCount").value(1))
            .andExpect(jsonPath("$.pageNumber").value(0))
            .andExpect(jsonPath("$.pageSize").value(20));
    }

    @Test
    @DisplayName("GET /api/stamp-requests/pending requires admin role")
    @WithMockUser(username = EMPLOYEE_EMAIL, roles = "USER")
    void pendingRequestsRequireAdmin() throws Exception {
        mockMvc.perform(get("/api/stamp-requests/pending"))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/stamp-requests/pending returns list for admins")
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void pendingRequestsReturnPayload() throws Exception {
        StampRequest pending = buildRequest(920, employee.getId());
        when(queryService.getPendingRequests(0, 20, null, null, "recent")).thenReturn(List.of(pending));
        when(queryService.countPendingRequests(null, null)).thenReturn(1);

        mockMvc.perform(get("/api/stamp-requests/pending"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.requests[0].employeeName").value("太郎 山田"))
            .andExpect(jsonPath("$.requests[0].requestedInTime").value("2025-11-12T09:30:00Z"))
            .andExpect(jsonPath("$.totalCount").value(1));
    }

    @Test
    @DisplayName("GET /api/stamp-requests/{id} forbids non-owner non-admin")
    @WithMockUser(username = "other@example.com", roles = "USER")
    void detailForbiddenForDifferentEmployee() throws Exception {
        Employee other = new Employee(77, "花子", "佐藤", "other@example.com", "encoded", 0, Timestamp.from(Instant.now()));
        when(employeeMapper.getEmployeeByEmail("other@example.com")).thenReturn(other);
        when(employeeMapper.getById(other.getId())).thenReturn(Optional.of(other));
        StampRequest request = buildRequest(930, employee.getId());
        when(queryService.getRequestDetail(930)).thenReturn(Optional.of(request));

        mockMvc.perform(get("/api/stamp-requests/930"))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/stamp-requests/{id} returns detail for owner")
    @WithMockUser(username = EMPLOYEE_EMAIL, roles = "USER")
    void detailReturnsPayloadForOwner() throws Exception {
        StampRequest request = buildRequest(931, employee.getId());
        when(queryService.getRequestDetail(931)).thenReturn(Optional.of(request));

        mockMvc.perform(get("/api/stamp-requests/931"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.reason").value("退勤時間が記録されなかったため"))
            .andExpect(jsonPath("$.approvalEmployeeName").value("一郎 管理者"));
    }

    @Test
    @DisplayName("POST /api/stamp-requests/{id}/approve returns payload for admins")
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void approveRequestAsAdmin() throws Exception {
        StampRequest approved = buildRequest(940, employee.getId());
        approved.setStatus("APPROVED");
        when(approvalService.approveRequest(940, admin.getId(), "確認済み")).thenReturn(approved);

        mockMvc.perform(post("/api/stamp-requests/{id}/approve", 940)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"approvalNote\":\"確認済み\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(940))
            .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    @DisplayName("POST /api/stamp-requests/{id}/approve forbids non-admins")
    @WithMockUser(username = EMPLOYEE_EMAIL, roles = "USER")
    void approveRequestForbiddenForNonAdmin() throws Exception {
        mockMvc.perform(post("/api/stamp-requests/{id}/approve", 941)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"approvalNote\":\"確認\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/stamp-requests/{id}/cancel returns cancelled payload")
    @WithMockUser(username = EMPLOYEE_EMAIL, roles = "USER")
    void cancelRequest() throws Exception {
        String reason = "再申請のため取り下げます";
        StampRequest cancelled = buildRequest(950, employee.getId());
        cancelled.setStatus("CANCELLED");
        cancelled.setCancellationReason(reason);
        when(cancellationService.cancelRequest(950, employee.getId(), reason)).thenReturn(cancelled);

        mockMvc.perform(post("/api/stamp-requests/{id}/cancel", 950)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("cancellationReason", reason))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("CANCELLED"))
            .andExpect(jsonPath("$.cancellationReason").value(reason));
    }

    @Test
    @DisplayName("POST /api/stamp-requests/bulk/approve returns response body")
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void bulkApproveReturnsPayload() throws Exception {
        StampRequestBulkOperationResponse response = new StampRequestBulkOperationResponse(2, 0, List.of());
        when(bulkOperationService.bulkApprove(eq(List.of(1, 2)), eq(admin.getId()), eq("batch"))).thenReturn(response);

        mockMvc.perform(post("/api/stamp-requests/bulk/approve")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"requestIds\":[1,2],\"approvalNote\":\"batch\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.successCount").value(2))
            .andExpect(jsonPath("$.failureCount").value(0));
    }

    @Test
    @DisplayName("POST /api/stamp-requests/bulk/approve returns 400 on invalid argument")
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void bulkApproveHandlesIllegalArgument() throws Exception {
        when(bulkOperationService.bulkApprove(eq(List.of(1, 2, 3)), eq(admin.getId()), eq(null)))
            .thenThrow(new IllegalArgumentException("上限を超えています"));

        mockMvc.perform(post("/api/stamp-requests/bulk/approve")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"requestIds\":[1,2,3]}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("上限を超えています"));
    }

    private StampRequest buildRequest(Integer id, Integer employeeId) {
        return StampRequest.builder()
            .id(id)
            .employeeId(employeeId)
            .stampHistoryId(321)
            .stampDate(LocalDate.of(2025, 11, 12))
            .originalInTime(OffsetDateTime.of(2025, 11, 12, 9, 0, 0, 0, ZoneOffset.UTC))
            .originalOutTime(OffsetDateTime.of(2025, 11, 12, 18, 0, 0, 0, ZoneOffset.UTC))
            .requestedInTime(OffsetDateTime.of(2025, 11, 12, 9, 30, 0, 0, ZoneOffset.UTC))
            .requestedOutTime(OffsetDateTime.of(2025, 11, 12, 18, 30, 0, 0, ZoneOffset.UTC))
            .reason("退勤時間が記録されなかったため")
            .status("PENDING")
            .approvalEmployeeId(admin.getId())
            .approvalNote("確認済み")
            .createdAt(OffsetDateTime.of(2025, 11, 12, 10, 0, 0, 0, ZoneOffset.UTC))
            .updatedAt(OffsetDateTime.of(2025, 11, 12, 10, 30, 0, 0, ZoneOffset.UTC))
            .build();
    }
}
