package com.example.teamdev.service.profile;

import com.example.teamdev.constant.AppConstants;
import com.example.teamdev.service.profile.model.ProfileChangeSet;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * プロフィール操作の監査ログを記録するサービス。
 */
@Service
public class ProfileAuditService {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    public ProfileAuditService(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper, Clock clock) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    public void recordView(int actorEmployeeId, int targetEmployeeId) {
        Instant now = clock.instant();
        insertLog(
            AppConstants.LogHistory.FUNCTION_PROFILE,
            AppConstants.LogHistory.OPERATION_PROFILE_VIEW,
            targetEmployeeId,
            actorEmployeeId,
            now,
            createDetail("プロフィールを閲覧", List.of(), Map.of(), Map.of())
        );
    }

    public void recordUpdate(int actorEmployeeId, int targetEmployeeId, ProfileChangeSet changeSet, Instant eventTime) {
        Instant timestamp = eventTime != null ? eventTime : clock.instant();
        insertLog(
            AppConstants.LogHistory.FUNCTION_PROFILE,
            AppConstants.LogHistory.OPERATION_PROFILE_UPDATE,
            targetEmployeeId,
            actorEmployeeId,
            timestamp,
            createDetail(
                changeSet.summary(),
                changeSet.changedFields(),
                changeSet.beforeSnapshot(),
                changeSet.afterSnapshot()
            )
        );
    }

    private void insertLog(
        int displayName,
        int operationType,
        int employeeId,
        int operatorId,
        Instant occurredAt,
        String detail
    ) {
        jdbcTemplate.update(
            "INSERT INTO log_history (display_name, operation_type, stamp_time, employee_id, update_employee_id, update_date, detail) " +
                "VALUES (?, ?, ?, ?, ?, ?, CAST(? AS jsonb))",
            displayName,
            operationType,
            Timestamp.from(occurredAt),
            employeeId,
            operatorId,
            Timestamp.from(occurredAt),
            detail
        );
    }

    private String createDetail(
        String summary,
        List<String> changedFields,
        Map<String, String> before,
        Map<String, String> after
    ) {
        var node = objectMapper.createObjectNode();
        node.put("summary", summary);
        node.set("changedFields", objectMapper.valueToTree(changedFields));
        node.set("before", objectMapper.valueToTree(before));
        node.set("after", objectMapper.valueToTree(after));
        try {
            return objectMapper.writeValueAsString(node);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize profile audit detail", e);
        }
    }
}
