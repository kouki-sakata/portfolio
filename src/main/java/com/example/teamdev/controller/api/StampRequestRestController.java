package com.example.teamdev.controller.api;

import com.example.teamdev.dto.api.stamprequest.StampRequestApprovalRequest;
import com.example.teamdev.dto.api.stamprequest.StampRequestBulkApprovalRequest;
import com.example.teamdev.dto.api.stamprequest.StampRequestBulkOperationResponse;
import com.example.teamdev.dto.api.stamprequest.StampRequestBulkRejectionRequest;
import com.example.teamdev.dto.api.stamprequest.StampRequestCancellationRequest;
import com.example.teamdev.dto.api.stamprequest.StampRequestCreateRequest;
import com.example.teamdev.dto.api.stamprequest.StampRequestListResponse;
import com.example.teamdev.dto.api.stamprequest.StampRequestRejectionRequest;
import com.example.teamdev.dto.api.stamprequest.StampRequestResponse;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.entity.StampRequest;
import com.example.teamdev.exception.StampRequestException;
import com.example.teamdev.mapper.EmployeeMapper;
import com.example.teamdev.service.StampRequestApprovalService;
import com.example.teamdev.service.StampRequestBulkOperationService;
import com.example.teamdev.service.StampRequestCancellationService;
import com.example.teamdev.service.StampRequestQueryService;
import com.example.teamdev.service.StampRequestRegistrationService;
import com.example.teamdev.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/stamp-requests")
@Tag(name = "Stamp Request Workflow", description = "打刻修正ワークフローAPI")
public class StampRequestRestController {

    private static final Logger log = LoggerFactory.getLogger(StampRequestRestController.class);

    private final StampRequestQueryService queryService;
    private final StampRequestRegistrationService registrationService;
    private final StampRequestApprovalService approvalService;
    private final StampRequestCancellationService cancellationService;
    private final StampRequestBulkOperationService bulkOperationService;
    private final EmployeeMapper employeeMapper;

    public StampRequestRestController(
        StampRequestQueryService queryService,
        StampRequestRegistrationService registrationService,
        StampRequestApprovalService approvalService,
        StampRequestCancellationService cancellationService,
        StampRequestBulkOperationService bulkOperationService,
        EmployeeMapper employeeMapper
    ) {
        this.queryService = queryService;
        this.registrationService = registrationService;
        this.approvalService = approvalService;
        this.cancellationService = cancellationService;
        this.bulkOperationService = bulkOperationService;
        this.employeeMapper = employeeMapper;
    }

    @PostMapping
    @Operation(summary = "打刻修正リクエストを作成する")
    public ResponseEntity<?> createRequest(
        @Valid @RequestBody StampRequestCreateRequest request
    ) {
        Integer employeeId = requireCurrentEmployeeId();
        try {
            StampRequest created = registrationService.createRequest(request, employeeId);
            return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(created));
        } catch (StampRequestException e) {
            return buildError(e.getStatus(), e.getMessage());
        } catch (IllegalArgumentException e) {
            return buildError(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @GetMapping("/my-requests")
    @Operation(summary = "自身の打刻修正リクエスト一覧を取得する")
    public ResponseEntity<StampRequestListResponse> getMyRequests(
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "0") Integer page,
        @RequestParam(defaultValue = "20") Integer size
    ) {
        Integer employeeId = requireCurrentEmployeeId();
        List<StampRequest> requests = queryService.getEmployeeRequests(employeeId, status, page, size);
        Integer totalCount = queryService.countEmployeeRequests(employeeId, status);
        return ResponseEntity.ok(toListResponse(requests, totalCount, page, size));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "保留中の打刻修正リクエストを取得する")
    public ResponseEntity<StampRequestListResponse> getPendingRequests(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "recent") String sort,
        @RequestParam(defaultValue = "0") Integer page,
        @RequestParam(defaultValue = "20") Integer size
    ) {
        List<StampRequest> requests = queryService.getPendingRequests(page, size, status, search, sort);
        Integer totalCount = queryService.countPendingRequests(status, search);
        return ResponseEntity.ok(toListResponse(requests, totalCount, page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "打刻修正リクエスト詳細を取得する")
    public ResponseEntity<StampRequestResponse> getRequestDetail(@PathVariable Integer id) {
        Integer employeeId = requireCurrentEmployeeId();
        StampRequest request = queryService.getRequestDetail(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "リクエストが見つかりません"));

        if (!SecurityUtil.isCurrentUserAdmin() && !request.getEmployeeId().equals(employeeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "このリクエストを閲覧する権限がありません");
        }

        return ResponseEntity.ok(toResponse(request));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "打刻修正リクエストを承認する")
    public ResponseEntity<?> approveRequest(
        @PathVariable Integer id,
        @Valid @RequestBody StampRequestApprovalRequest request
    ) {
        Integer approverId = requireCurrentEmployeeId();
        try {
            StampRequest updated = approvalService.approveRequest(id, approverId, request.approvalNote());
            return ResponseEntity.ok(toResponse(updated));
        } catch (StampRequestException e) {
            return buildError(e.getStatus(), e.getMessage());
        } catch (IllegalArgumentException e) {
            return buildError(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "打刻修正リクエストを却下する")
    public ResponseEntity<?> rejectRequest(
        @PathVariable Integer id,
        @Valid @RequestBody StampRequestRejectionRequest request
    ) {
        Integer rejecterId = requireCurrentEmployeeId();
        try {
            StampRequest updated = approvalService.rejectRequest(id, rejecterId, request.rejectionReason());
            return ResponseEntity.ok(toResponse(updated));
        } catch (StampRequestException e) {
            return buildError(e.getStatus(), e.getMessage());
        } catch (IllegalArgumentException e) {
            return buildError(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "打刻修正リクエストを取消する")
    public ResponseEntity<?> cancelRequest(
        @PathVariable Integer id,
        @Valid @RequestBody StampRequestCancellationRequest request
    ) {
        Integer employeeId = requireCurrentEmployeeId();
        try {
            StampRequest updated = cancellationService.cancelRequest(id, employeeId, request.cancellationReason());
            return ResponseEntity.ok(toResponse(updated));
        } catch (StampRequestException e) {
            return buildError(e.getStatus(), e.getMessage());
        } catch (IllegalArgumentException e) {
            return buildError(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping({"/bulk/approve", "/bulk-approve"})
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "打刻修正リクエストを一括承認する")
    public ResponseEntity<?> bulkApprove(
        @Valid @RequestBody StampRequestBulkApprovalRequest request
    ) {
        try {
            Integer approverId = requireCurrentEmployeeId();
            StampRequestBulkOperationResponse result =
                bulkOperationService.bulkApprove(request.requestIds(), approverId, request.approvalNote());
            return ResponseEntity.ok(result);
        } catch (StampRequestException e) {
            return buildError(e.getStatus(), e.getMessage());
        } catch (IllegalArgumentException e) {
            return buildError(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (RuntimeException e) {
            log.error("Bulk approve failed", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "一括承認に失敗しました");
        }
    }

    @PostMapping({"/bulk/reject", "/bulk-reject"})
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "打刻修正リクエストを一括却下する")
    public ResponseEntity<?> bulkReject(
        @Valid @RequestBody StampRequestBulkRejectionRequest request
    ) {
        try {
            Integer rejecterId = requireCurrentEmployeeId();
            StampRequestBulkOperationResponse result =
                bulkOperationService.bulkReject(request.requestIds(), rejecterId, request.rejectionReason());
            return ResponseEntity.ok(result);
        } catch (StampRequestException e) {
            return buildError(e.getStatus(), e.getMessage());
        } catch (IllegalArgumentException e) {
            return buildError(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (RuntimeException e) {
            log.error("Bulk reject failed", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "一括却下に失敗しました");
        }
    }

    private StampRequestListResponse toListResponse(
        List<StampRequest> requests,
        Integer totalCount,
        Integer page,
        Integer size
    ) {
        List<StampRequestResponse> responses = requests.stream()
            .map(this::toResponse)
            .toList();
        return new StampRequestListResponse(responses, totalCount, page, size);
    }

    private StampRequestResponse toResponse(StampRequest request) {
        String employeeName = resolveEmployeeName(request.getEmployeeId());
        String approvalEmployeeName = resolveEmployeeName(request.getApprovalEmployeeId());
        String rejectionEmployeeName = resolveEmployeeName(request.getRejectionEmployeeId());
        OffsetDateTime createdAt = request.getCreatedAt();
        OffsetDateTime updatedAt = request.getUpdatedAt();

        Long submittedTimestamp = createdAt != null ? createdAt.toInstant().toEpochMilli() : null;
        Long updatedTimestamp = updatedAt != null ? updatedAt.toInstant().toEpochMilli() : null;

        return new StampRequestResponse(
            request.getId(),
            request.getEmployeeId(),
            employeeName,
            request.getStampHistoryId(),
            request.getStampDate() != null ? request.getStampDate().toString() : null,
            toIso(request.getOriginalInTime()),
            toIso(request.getOriginalOutTime()),
            toIso(request.getOriginalBreakStartTime()),
            toIso(request.getOriginalBreakEndTime()),
            request.getOriginalIsNightShift(),
            toIso(request.getRequestedInTime()),
            toIso(request.getRequestedOutTime()),
            toIso(request.getRequestedBreakStartTime()),
            toIso(request.getRequestedBreakEndTime()),
            request.getRequestedIsNightShift(),
            request.getReason(),
            request.getStatus(),
            request.getApprovalNote(),
            request.getRejectionReason(),
            request.getCancellationReason(),
            request.getApprovalEmployeeId(),
            approvalEmployeeName,
            request.getRejectionEmployeeId(),
            rejectionEmployeeName,
            toIso(createdAt),
            toIso(updatedAt),
            toIso(request.getApprovedAt()),
            toIso(request.getRejectedAt()),
            toIso(request.getCancelledAt()),
            submittedTimestamp,
            updatedTimestamp
        );
    }

    private String resolveEmployeeName(Integer employeeId) {
        if (employeeId == null) {
            return null;
        }
        Optional<Employee> employee = employeeMapper.getById(employeeId);
        return employee.map(e -> "%s %s".formatted(e.getFirstName(), e.getLastName())).orElse(null);
    }

    private String toIso(OffsetDateTime value) {
        return value != null ? value.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME) : null;
    }

    private Integer requireCurrentEmployeeId() {
        Integer employeeId = SecurityUtil.getCurrentEmployeeId();
        if (employeeId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "認証が必要です");
        }
        return employeeId;
    }

    private Map<String, String> errorBody(String message) {
        return Map.of("message", message != null ? message : "不明なエラーが発生しました");
    }

    private ResponseEntity<Map<String, String>> buildError(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(errorBody(message));
    }
}
