package com.example.teamdev.controller.api;

import com.example.teamdev.dto.api.stamp.StampCreateRequest;
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
import org.springframework.web.bind.annotation.PostMapping;
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

    @Operation(summary = "打刻履歴新規作成", description = "新しい打刻履歴を作成する")
    @PostMapping
    public ResponseEntity<Void> createStamp(@Valid @RequestBody StampCreateRequest request) {
        Integer operatorId = requireAuthenticatedEmployeeId();

        // 管理者以外は自分自身のレコードのみ作成可能
        boolean isOwner = Objects.equals(request.employeeId(), operatorId);
        if (!isOwner && !SecurityUtil.isCurrentUserAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "他の従業員の打刻は作成できません");
        }

        Map<String, Object> payload = buildCreatePayload(request);
        stampEditService.execute(List.of(payload), operatorId);

        return ResponseEntity.status(HttpStatus.CREATED).build();
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

        String resolvedInTime = resolveTimeValue(request.inTime(), target.getInTime());
        if (resolvedInTime != null) {
            payload.put("inTime", resolvedInTime);
        }

        String resolvedOutTime = resolveTimeValue(request.outTime(), target.getOutTime());
        if (resolvedOutTime != null) {
            payload.put("outTime", resolvedOutTime);
        }

        // 休憩時間は空文字列を削除として扱う
        String resolvedBreakStartTime = resolveBreakTimeValue(request.breakStartTime(), target.getBreakStartTime());
        payload.put("breakStartTime", resolvedBreakStartTime);

        String resolvedBreakEndTime = resolveBreakTimeValue(request.breakEndTime(), target.getBreakEndTime());
        payload.put("breakEndTime", resolvedBreakEndTime);

        // 夜勤フラグの処理
        if (request.isNightShift() != null) {
            payload.put("isNightShift", request.isNightShift());
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

    /**
     * 休憩時間専用の解決ロジック。空文字列を明示的な削除として扱う。
     *
     * @param requested リクエストで指定された値（null=未指定、空文字列=削除、値あり=更新）
     * @param existing  既存のデータベース値
     * @return 解決された文字列（nullは削除を意味する）
     */
    private String resolveBreakTimeValue(String requested, OffsetDateTime existing) {
        if (requested != null) {
            // 空文字列の場合は削除（nullを返す）
            if (requested.isBlank()) {
                return null;
            }
            // 値がある場合はそのまま返す
            return requested;
        }
        // リクエストにフィールドがない場合は既存値を保持
        if (existing == null) {
            return null;
        }
        return TIME_FORMATTER.format(existing);
    }

    /**
     * 新規作成用のペイロードを構築します。
     *
     * @param request 新規作成リクエスト
     * @return stampEditServiceに渡すペイロード
     */
    private Map<String, Object> buildCreatePayload(StampCreateRequest request) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("employeeId", request.employeeId().toString());
        payload.put("year", request.year());
        payload.put("month", request.month());
        payload.put("day", request.day());

        if (request.inTime() != null && !request.inTime().isBlank()) {
            payload.put("inTime", request.inTime());
        }
        if (request.outTime() != null && !request.outTime().isBlank()) {
            payload.put("outTime", request.outTime());
        }
        if (request.breakStartTime() != null && !request.breakStartTime().isBlank()) {
            payload.put("breakStartTime", request.breakStartTime());
        }
        if (request.breakEndTime() != null && !request.breakEndTime().isBlank()) {
            payload.put("breakEndTime", request.breakEndTime());
        }
        if (request.isNightShift() != null) {
            payload.put("isNightShift", request.isNightShift());
        }

        return payload;
    }
}
