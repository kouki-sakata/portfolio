package com.example.teamdev.controller.api;

import com.example.teamdev.dto.api.stamp.StampUpdateRequest;
import com.example.teamdev.entity.StampHistory;
import com.example.teamdev.mapper.StampHistoryMapper;
import com.example.teamdev.service.StampDeleteService;
import com.example.teamdev.service.StampEditService;
import com.example.teamdev.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/stamps")
@Tag(name = "Stamp", description = "打刻履歴の更新・削除 API")
public class StampRestController {

    private static final DateTimeFormatter TIME_FORMATTER =
        DateTimeFormatter.ofPattern("HH:mm", Locale.JAPAN).withZone(ZoneId.of("Asia/Tokyo"));

    private final StampEditService stampEditService;
    private final StampDeleteService stampDeleteService;
    private final StampHistoryMapper stampHistoryMapper;

    public StampRestController(
        StampEditService stampEditService,
        StampDeleteService stampDeleteService,
        StampHistoryMapper stampHistoryMapper
    ) {
        this.stampEditService = stampEditService;
        this.stampDeleteService = stampDeleteService;
        this.stampHistoryMapper = stampHistoryMapper;
    }

    @Operation(summary = "打刻履歴更新", description = "打刻IDを指定して時刻を更新する")
    @PutMapping("/{id}")
    public ResponseEntity<Void> updateStamp(
        @PathVariable Integer id,
        @Valid @RequestBody StampUpdateRequest request
    ) {
        Integer operatorId = requireAuthenticatedEmployeeId();
        StampHistory target = fetchAndAuthorize(id, operatorId);

        Map<String, Object> payload = buildUpdatePayload(target, request);
        stampEditService.execute(List.of(payload), operatorId);

        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "打刻履歴削除", description = "打刻IDを指定して削除する")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStamp(@PathVariable Integer id) {
        Integer operatorId = requireAuthenticatedEmployeeId();
        fetchAndAuthorize(id, operatorId);

        boolean deleted = stampDeleteService.deleteStampById(id, operatorId);
        if (!deleted) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Stamp not found");
        }

        return ResponseEntity.noContent().build();
    }

    private Integer requireAuthenticatedEmployeeId() {
        Integer employeeId = SecurityUtil.getCurrentEmployeeId();
        if (employeeId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return employeeId;
    }

    private StampHistory fetchAndAuthorize(Integer id, Integer operatorId) {
        Optional<StampHistory> optionalStamp = stampHistoryMapper.getById(id);
        if (optionalStamp.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Stamp not found");
        }

        StampHistory stamp = optionalStamp.get();
        boolean isOwner = Objects.equals(stamp.getEmployeeId(), operatorId);
        if (!isOwner && !SecurityUtil.isCurrentUserAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return stamp;
    }

    private Map<String, Object> buildUpdatePayload(StampHistory target, StampUpdateRequest request) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", target.getId().toString());
        payload.put("employeeId", target.getEmployeeId().toString());
        payload.put("year", target.getYear());
        payload.put("month", target.getMonth());
        payload.put("day", target.getDay());

        if (request.inTime() != null && !request.inTime().isBlank()) {
            payload.put("inTime", request.inTime());
        }
        if (request.outTime() != null && !request.outTime().isBlank()) {
            payload.put("outTime", request.outTime());
        }

        return payload;
    }

    private String resolveTimeValue(String requested, OffsetDateTime existing) {
        if (requested != null && !requested.isBlank()) {
            return requested;
        }
        if (existing == null) {
            return null;
        }
        return TIME_FORMATTER.format(existing);
    }
}
