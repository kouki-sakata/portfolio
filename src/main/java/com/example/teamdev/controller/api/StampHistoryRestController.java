package com.example.teamdev.controller.api;

import com.example.teamdev.dto.api.stamp.StampHistoryEntryResponse;
import com.example.teamdev.dto.api.stamp.StampHistoryResponse;
import com.example.teamdev.service.StampHistoryService;
import com.example.teamdev.util.SecurityUtil;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;

@RestController
@RequestMapping("/api/stamp-history")
@Tag(name = "Stamp History", description = "打刻履歴 API")
public class StampHistoryRestController {

    private final StampHistoryService stampHistoryService;

    public StampHistoryRestController(StampHistoryService stampHistoryService) {
        this.stampHistoryService = stampHistoryService;
    }

    @Operation(summary = "打刻履歴取得", description = "年・月の指定がなければ当月を返却")
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<StampHistoryResponse> history(
        @RequestParam(value = "year", required = false) String year,
        @RequestParam(value = "month", required = false) String month
    ) {
        Integer employeeId = SecurityUtil.getCurrentEmployeeId();
        if (employeeId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        LocalDate today = LocalDate.now();
        String resolvedYear = (year != null && !year.isBlank()) ? year : String.valueOf(today.getYear());
        String resolvedMonth = (month != null && !month.isBlank()) ? month : String.format("%02d", today.getMonthValue());

        List<Map<String, Object>> entries = stampHistoryService.execute(resolvedYear, resolvedMonth, employeeId);
        List<String> years = stampHistoryService.getYearList();
        List<String> months = stampHistoryService.getMonthList();

        List<StampHistoryEntryResponse> mappedEntries = entries.stream()
            .map(this::toEntry)
            .toList();

        StampHistoryResponse response = new StampHistoryResponse(resolvedYear, resolvedMonth, years, months, mappedEntries);
        return ResponseEntity.ok(response);
    }

    private StampHistoryEntryResponse toEntry(Map<String, Object> source) {
        return new StampHistoryEntryResponse(
            asInteger(source.get("id")),
            asString(source.get("year")),
            asString(source.get("month")),
            asString(source.get("day")),
            asString(source.get("day_of_week")),
            asInteger(source.get("employee_id")),
            asString(source.get("employee_name")),
            asString(source.get("update_employee_name")),
            asString(source.get("in_time")),
            asString(source.get("out_time")),
            asString(source.get("update_date"))
        );
    }

    private Integer asInteger(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        return null;
    }

    private String asString(Object value) {
        return value != null ? value.toString() : null;
    }
}
