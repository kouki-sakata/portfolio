package com.example.teamdev.controller.api;

import com.example.teamdev.dto.api.profile.AttendanceSummaryResponse;
import com.example.teamdev.dto.api.profile.MonthlyAttendanceResponse;
import com.example.teamdev.dto.api.profile.ProfileActivityItemResponse;
import com.example.teamdev.dto.api.profile.ProfileActivityResponse;
import com.example.teamdev.dto.api.profile.ProfileEmployeeResponse;
import com.example.teamdev.dto.api.profile.ProfileMetadataResponse;
import com.example.teamdev.dto.api.profile.ProfileMetadataUpdateRequest;
import com.example.teamdev.dto.api.profile.ProfileResponse;
import com.example.teamdev.dto.api.profile.ProfileScheduleResponse;
import com.example.teamdev.dto.api.profile.ProfileStatisticsResponse;
import com.example.teamdev.service.profile.ProfileAppService;
import com.example.teamdev.service.profile.ProfileAttendanceStatisticsService;
import com.example.teamdev.service.profile.model.ProfileActivityEntry;
import com.example.teamdev.service.profile.model.ProfileActivityPage;
import com.example.teamdev.service.profile.model.ProfileActivityQuery;
import com.example.teamdev.service.profile.model.ProfileAggregate;
import com.example.teamdev.service.profile.model.ProfileMetadataDocument;
import com.example.teamdev.service.profile.model.ProfileMetadataUpdateCommand;
import com.example.teamdev.service.profile.model.ProfileStatisticsData;
import com.example.teamdev.service.profile.model.ProfileWorkScheduleDocument;
import com.example.teamdev.util.SecurityUtil;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/profile")
@Validated
public class UserProfileRestController {

    private final ProfileAppService profileAppService;
    private final ProfileAttendanceStatisticsService statisticsService;

    public UserProfileRestController(
        ProfileAppService profileAppService,
        ProfileAttendanceStatisticsService statisticsService
    ) {
        this.profileAppService = profileAppService;
        this.statisticsService = statisticsService;
    }

    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> getSelfProfile() {
        int currentId = requireCurrentEmployeeId();
        ProfileAggregate aggregate = profileAppService.loadSelfProfile(currentId);
        return ResponseEntity.ok(toResponse(aggregate));
    }

    @GetMapping("/{employeeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProfileResponse> getProfileForAdmin(@PathVariable int employeeId) {
        int currentId = requireCurrentEmployeeId();
        ProfileAggregate aggregate = profileAppService.loadProfileForAdmin(employeeId, currentId);
        return ResponseEntity.ok(toResponse(aggregate));
    }

    @PatchMapping("/me/metadata")
    public ResponseEntity<ProfileResponse> updateSelfMetadata(
        @Valid @RequestBody ProfileMetadataUpdateRequest request
    ) {
        int currentId = requireCurrentEmployeeId();
        ProfileAggregate aggregate = profileAppService.updateMetadata(
            currentId,
            currentId,
            toCommand(request)
        );
        return ResponseEntity.ok(toResponse(aggregate));
    }

    @PatchMapping("/{employeeId}/metadata")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProfileResponse> updateMetadataAsAdmin(
        @PathVariable int employeeId,
        @Valid @RequestBody ProfileMetadataUpdateRequest request
    ) {
        int currentId = requireCurrentEmployeeId();
        ProfileAggregate aggregate = profileAppService.updateMetadata(
            currentId,
            employeeId,
            toCommand(request)
        );
        return ResponseEntity.ok(toResponse(aggregate));
    }

    @GetMapping("/me/activity")
    public ResponseEntity<ProfileActivityResponse> getSelfActivity(
        @RequestParam(name = "page", defaultValue = "0") int page,
        @RequestParam(name = "size", defaultValue = "20") int size,
        @RequestParam(name = "from", required = false) String from,
        @RequestParam(name = "to", required = false) String to
    ) {
        int currentId = requireCurrentEmployeeId();
        ProfileActivityPage result = profileAppService.listActivities(
            currentId,
            currentId,
            new ProfileActivityQuery(
                page,
                size,
                parseInstant(from),
                parseInstant(to)
            )
        );
        return ResponseEntity.ok(toResponse(result));
    }

    private ProfileMetadataUpdateCommand toCommand(ProfileMetadataUpdateRequest request) {
        ProfileWorkScheduleDocument schedule = new ProfileWorkScheduleDocument(
            request.scheduleStart(),
            request.scheduleEnd(),
            request.scheduleBreakMinutes() != null ? request.scheduleBreakMinutes() : 60
        );
        return new ProfileMetadataUpdateCommand(
            request.address(),
            request.department(),
            request.employeeNumber(),
            request.activityNote(),
            request.location(),
            request.manager(),
            request.workStyle(),
            schedule,
            request.status(),
            request.joinedAt(),
            request.avatarUrl()
        );
    }

    private ProfileResponse toResponse(ProfileAggregate aggregate) {
        ProfileEmployeeResponse employee = new ProfileEmployeeResponse(
            aggregate.employee().id(),
            aggregate.employee().fullName(),
            aggregate.employee().email(),
            aggregate.employee().admin(),
            aggregate.employee().updatedAt()
        );
        ProfileMetadataResponse metadata = toResponse(aggregate.metadata());
        return new ProfileResponse(employee, metadata);
    }

    private ProfileMetadataResponse toResponse(ProfileMetadataDocument metadata) {
        return new ProfileMetadataResponse(
            metadata.address(),
            metadata.department(),
            metadata.employeeNumber(),
            metadata.activityNote(),
            metadata.location(),
            metadata.manager(),
            metadata.workStyle(),
            new ProfileScheduleResponse(
                metadata.schedule().start(),
                metadata.schedule().end(),
                metadata.schedule().breakMinutes()
            ),
            metadata.status(),
            metadata.joinedAt(),
            metadata.avatarUrl()
        );
    }

    private ProfileActivityResponse toResponse(ProfileActivityPage page) {
        List<ProfileActivityItemResponse> items = page.items().stream()
            .map(this::toResponse)
            .toList();
        return new ProfileActivityResponse(
            page.page(),
            page.size(),
            page.totalPages(),
            page.totalElements(),
            items
        );
    }

    private ProfileActivityItemResponse toResponse(ProfileActivityEntry entry) {
        return new ProfileActivityItemResponse(
            entry.id(),
            entry.occurredAt(),
            entry.actor(),
            entry.operationType(),
            entry.summary(),
            entry.changedFields(),
            entry.beforeSnapshot(),
            entry.afterSnapshot()
        );
    }

    private ProfileStatisticsResponse toStatisticsResponse(ProfileStatisticsData data) {
        // トレンドデータの変換
        List<AttendanceSummaryResponse.MonthlyTrendResponse> trendResponses = data.summary().trend().stream()
            .map(trend -> new AttendanceSummaryResponse.MonthlyTrendResponse(
                trend.month(),
                trend.totalHours(),
                trend.overtimeHours()
            ))
            .toList();

        // 当月データの変換
        AttendanceSummaryResponse.CurrentMonthData currentMonthData =
            new AttendanceSummaryResponse.CurrentMonthData(
                data.summary().totalHours(),
                data.summary().overtimeHours(),
                data.summary().lateCount(),
                data.summary().paidLeaveHours()
            );

        // サマリーレスポンスの構築
        AttendanceSummaryResponse summaryResponse = new AttendanceSummaryResponse(
            currentMonthData,
            trendResponses
        );

        // 月次データの変換
        List<MonthlyAttendanceResponse> monthlyResponses = data.monthly().stream()
            .map(monthly -> new MonthlyAttendanceResponse(
                monthly.month(),
                monthly.totalHours(),
                monthly.overtimeHours(),
                monthly.lateCount(),
                monthly.paidLeaveHours()
            ))
            .toList();

        return new ProfileStatisticsResponse(summaryResponse, monthlyResponses);
    }

    private Optional<Instant> parseInstant(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(Instant.parse(value));
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date format: " + value, ex);
        }
    }

    private int requireCurrentEmployeeId() {
        Integer id = SecurityUtil.getCurrentEmployeeId();
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthenticated");
        }
        return id;
    }
}
