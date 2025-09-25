package com.example.teamdev.controller.api;

import com.example.teamdev.constant.AppConstants;
import com.example.teamdev.dto.api.common.EmployeeSummaryResponse;
import com.example.teamdev.dto.api.home.HomeDashboardResponse;
import com.example.teamdev.dto.api.home.HomeNewsItem;
import com.example.teamdev.dto.api.home.StampRequest;
import com.example.teamdev.dto.api.home.StampResponse;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.form.HomeForm;
import com.example.teamdev.service.HomeNewsService;
import com.example.teamdev.service.StampService;
import com.example.teamdev.util.MessageUtil;
import com.example.teamdev.util.SecurityUtil;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/home")
public class HomeRestController {

    private static final DateTimeFormatter INPUT_FORMATTER = DateTimeFormatter.ofPattern(AppConstants.DateFormat.ISO_LOCAL_DATE_TIME);
    private static final DateTimeFormatter OUTPUT_FORMATTER = DateTimeFormatter.ofPattern(AppConstants.DateFormat.DISPLAY_DATE_TIME);

    private final HomeNewsService homeNewsService;
    private final StampService stampService;

    public HomeRestController(HomeNewsService homeNewsService, StampService stampService) {
        this.homeNewsService = homeNewsService;
        this.stampService = stampService;
    }

    @GetMapping("/overview")
    public ResponseEntity<HomeDashboardResponse> overview() {
        Employee currentEmployee = SecurityUtil.getCurrentEmployee();
        if (currentEmployee == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        List<HomeNewsItem> newsItems = homeNewsService.execute().stream()
            .map(this::toNewsItem)
            .toList();

        HomeDashboardResponse response = new HomeDashboardResponse(toEmployeeSummary(currentEmployee), newsItems);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/stamps")
    public ResponseEntity<StampResponse> stamp(@Valid @RequestBody StampRequest request) {
        Integer employeeId = SecurityUtil.getCurrentEmployeeId();
        if (employeeId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        HomeForm form = new HomeForm(request.stampTime(), request.stampType(), request.nightWorkFlag());
        stampService.execute(form, employeeId);

        LocalDateTime dateTime = LocalDateTime.parse(request.stampTime(), INPUT_FORMATTER);
        String formattedDateTime = dateTime.format(OUTPUT_FORMATTER);
        String messageKey = request.stampType().equals(AppConstants.Stamp.TYPE_ATTENDANCE) ?
            "stamp.attendance.success" : "stamp.departure.success";
        String message = MessageUtil.getMessage(messageKey, new Object[]{formattedDateTime});

        return ResponseEntity.ok(new StampResponse(message));
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

    @SuppressWarnings("unchecked")
    private HomeNewsItem toNewsItem(Map<String, Object> source) {
        return new HomeNewsItem(
            (Integer) source.get("id"),
            (String) source.get("content"),
            (String) source.get("news_date"),
            source.get("release_flag") instanceof Boolean flag ? flag : Boolean.TRUE
        );
    }
}
