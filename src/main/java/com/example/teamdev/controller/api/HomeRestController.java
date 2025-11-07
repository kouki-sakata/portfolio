package com.example.teamdev.controller.api;

import com.example.teamdev.constant.AppConstants;
import com.example.teamdev.dto.api.common.EmployeeSummaryResponse;
import com.example.teamdev.dto.api.home.BreakToggleRequest;
import com.example.teamdev.dto.api.home.HomeDashboardResponse;
import com.example.teamdev.dto.api.home.HomeNewsItem;
import com.example.teamdev.dto.api.home.StampRequest;
import com.example.teamdev.dto.api.home.StampResponse;
import com.example.teamdev.dto.api.home.StampType;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.exception.DuplicateStampException;
import com.example.teamdev.form.HomeForm;
import com.example.teamdev.service.HomeAttendanceService;
import com.example.teamdev.service.HomeNewsService;
import com.example.teamdev.service.StampService;
import com.example.teamdev.service.dto.DailyAttendanceSnapshot;
import com.example.teamdev.util.MessageUtil;
import com.example.teamdev.util.SecurityUtil;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/home")
@Tag(name = "Home", description = "ホーム ダッシュボード/打刻 API")
public class HomeRestController {

    private static final DateTimeFormatter INPUT_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
    private static final DateTimeFormatter OUTPUT_FORMATTER = DateTimeFormatter.ofPattern(AppConstants.DateFormat.DISPLAY_DATE_TIME);

    private final HomeNewsService homeNewsService;
    private final StampService stampService;
    private final HomeAttendanceService homeAttendanceService;

    public HomeRestController(
        HomeNewsService homeNewsService,
        StampService stampService,
        HomeAttendanceService homeAttendanceService
    ) {
        this.homeNewsService = homeNewsService;
        this.stampService = stampService;
        this.homeAttendanceService = homeAttendanceService;
    }

    @Operation(summary = "ホーム概要", description = "ログイン中の従業員情報とお知らせ一覧を返却")
    @GetMapping(value = "/overview", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<HomeDashboardResponse> overview() {
        Employee currentEmployee = SecurityUtil.getCurrentEmployee();
        if (currentEmployee == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        List<HomeNewsItem> newsItems = homeNewsService.execute();
        Optional<DailyAttendanceSnapshot> attendance = homeAttendanceService.fetchTodaySnapshot(
            currentEmployee.getId(),
            ZoneId.of("Asia/Tokyo")
        );

        HomeDashboardResponse response = new HomeDashboardResponse(
            toEmployeeSummary(currentEmployee),
            newsItems,
            attendance.orElse(null)
        );
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "打刻", description = "出勤/退勤の打刻を記録")
    @PostMapping(value = "/stamps", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<StampResponse> stamp(@Valid @RequestBody StampRequest request) {
        Integer employeeId = SecurityUtil.getCurrentEmployeeId();
        if (employeeId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        HomeForm form = new HomeForm(request.stampTime(), request.stampType(), request.nightWorkFlag());

        try {
            stampService.execute(form, employeeId);
        } catch (DuplicateStampException e) {
            // 409 Conflict でクライアントに通知
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }

        OffsetDateTime dateTime = OffsetDateTime.parse(request.stampTime(), INPUT_FORMATTER);
        // 日本時間に変換してフォーマット
        String formattedDateTime = dateTime.atZoneSameInstant(ZoneId.of("Asia/Tokyo"))
            .format(OUTPUT_FORMATTER);
        String messageKey = request.stampType() == StampType.ATTENDANCE ?
            "stamp.attendance.success" : "stamp.departure.success";
        String message = MessageUtil.getMessage(messageKey, new Object[]{formattedDateTime});

        return ResponseEntity.ok(new StampResponse(message));
    }

    @Operation(summary = "休憩トグル", description = "休憩開始/終了を切り替える")
    @PostMapping(value = "/breaks/toggle", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> toggleBreak(@Valid @RequestBody BreakToggleRequest request) {
        Integer employeeId = SecurityUtil.getCurrentEmployeeId();
        if (employeeId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        OffsetDateTime toggleTime = OffsetDateTime.parse(request.timestamp(), INPUT_FORMATTER);
        stampService.toggleBreak(employeeId, toggleTime);
        return ResponseEntity.noContent().build();
    }

    private EmployeeSummaryResponse toEmployeeSummary(Employee employee) {
        boolean admin = employee.getAdmin_flag() != null && employee.getAdmin_flag() == AppConstants.Employee.ADMIN_FLAG_ADMIN;
        return new EmployeeSummaryResponse(
            employee.getId(),
            employee.getFirst_name(),
            employee.getLast_name(),
            employee.getEmail(),
            admin
        );
    }
}
