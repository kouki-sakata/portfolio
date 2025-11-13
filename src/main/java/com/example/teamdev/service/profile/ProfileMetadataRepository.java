package com.example.teamdev.service.profile;

import com.example.teamdev.service.profile.model.ProfileMetadataDocument;
import com.example.teamdev.service.profile.model.ProfileWorkScheduleDocument;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Objects;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

/**
 * employee.profile_metadata JSONB カラムを扱うリポジトリ。
 */
@Repository
public class ProfileMetadataRepository {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    private static final String DEFAULT_SCHEDULE_START = "09:00";
    private static final String DEFAULT_SCHEDULE_END = "18:00";
    private static final int DEFAULT_BREAK_MINUTES = 60;
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    public ProfileMetadataRepository(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * プロフィールメタデータを取得します。
     */
    public ProfileMetadataDocument load(int employeeId) {
        MetadataRow row = jdbcTemplate.query(
            """
            SELECT
                COALESCE(profile_metadata::text, '{}') AS payload,
                TO_CHAR(schedule_start, 'HH24:MI') AS schedule_start,
                TO_CHAR(schedule_end, 'HH24:MI') AS schedule_end,
                schedule_break_minutes
            FROM employee
            WHERE id = ?
            """,
            ps -> ps.setInt(1, employeeId),
            rs -> rs.next()
                ? new MetadataRow(
                    rs.getString("payload"),
                    rs.getString("schedule_start"),
                    rs.getString("schedule_end"),
                    (Integer) rs.getObject("schedule_break_minutes")
                )
                : null
        );

        if (row == null) {
            throw new IllegalArgumentException("Employee not found for id=" + employeeId);
        }

        try {
            JsonNode root = objectMapper.readTree(row.payload());
            return toDocument(root, row);
        } catch (JsonProcessingException ex) {
            return defaultDocument();
        }
    }

    /**
     * プロフィールメタデータを保存します。
     */
    public void save(int employeeId, ProfileMetadataDocument document, Timestamp updatedAt) {
        Objects.requireNonNull(document, "document must not be null");
        String payload;
        String scheduleStart = sanitizeTime(document.schedule().start(), DEFAULT_SCHEDULE_START);
        String scheduleEnd = sanitizeTime(document.schedule().end(), DEFAULT_SCHEDULE_END);
        int breakMinutes = sanitizeBreakMinutes(document.schedule().breakMinutes());
        try {
            payload = objectMapper.writeValueAsString(toJson(document));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize profile metadata", e);
        }

        int updated = jdbcTemplate.update(
            "UPDATE employee SET profile_metadata = CAST(? AS jsonb), schedule_start = CAST(? AS time), "
                + "schedule_end = CAST(? AS time), schedule_break_minutes = ?, update_date = ? WHERE id = ?",
            payload,
            scheduleStart,
            scheduleEnd,
            breakMinutes,
            updatedAt != null ? updatedAt : Timestamp.from(Instant.now()),
            employeeId
        );
        if (updated == 0) {
            throw new IllegalArgumentException("Employee not found for id=" + employeeId);
        }
    }

    private ProfileMetadataDocument toDocument(JsonNode root, MetadataRow row) {
        if (root == null || root.isMissingNode()) {
            return defaultDocument();
        }
        JsonNode scheduleNode = root.path("schedule");
        return new ProfileMetadataDocument(
            text(root, "address"),
            text(root, "department"),
            text(root, "employeeNumber"),
            text(root, "activityNote"),
            text(root, "location"),
            text(root, "manager"),
            textOrDefault(root, "workStyle", "onsite"),
            new ProfileWorkScheduleDocument(
                coalesceScheduleValue(row.scheduleStart(), scheduleNode, "start", DEFAULT_SCHEDULE_START),
                coalesceScheduleValue(row.scheduleEnd(), scheduleNode, "end", DEFAULT_SCHEDULE_END),
                coalesceBreakMinutes(row.scheduleBreakMinutes(), scheduleNode)
            ),
            textOrDefault(root, "status", "active"),
            text(root, "joinedAt"),
            text(root, "avatarUrl")
        );
    }

    private JsonNode toJson(ProfileMetadataDocument document) {
        com.fasterxml.jackson.databind.node.ObjectNode root = objectMapper.createObjectNode();
        root.put("address", safe(document.address()))
            .put("department", safe(document.department()))
            .put("employeeNumber", safe(document.employeeNumber()))
            .put("activityNote", safe(document.activityNote()))
            .put("location", safe(document.location()))
            .put("manager", safe(document.manager()))
            .put("workStyle", safe(document.workStyle()))
            .put("status", safe(document.status()))
            .put("joinedAt", safe(document.joinedAt()))
            .put("avatarUrl", safe(document.avatarUrl()));
        return root;
    }

    private ProfileMetadataDocument defaultDocument() {
        return new ProfileMetadataDocument(
            "",
            "",
            "",
            "",
            "",
            "",
            "onsite",
            new ProfileWorkScheduleDocument(DEFAULT_SCHEDULE_START, DEFAULT_SCHEDULE_END, DEFAULT_BREAK_MINUTES),
            "active",
            "",
            ""
        );
    }

    private static String safe(String value) {
        return value != null ? value : "";
    }

    private static String text(JsonNode node, String field) {
        JsonNode child = node.path(field);
        return child.isMissingNode() || child.isNull() ? "" : child.asText("");
    }

    private static String textOrDefault(JsonNode node, String field, String defaultValue) {
        JsonNode child = node.path(field);
        return child.isMissingNode() || child.isNull() ? defaultValue : child.asText(defaultValue);
    }

    private static int integerOrDefault(JsonNode node, String field, int defaultValue) {
        JsonNode child = node.path(field);
        return child.isMissingNode() || !child.isInt() ? defaultValue : child.asInt(defaultValue);
    }

    private String sanitizeTime(String value, String fallback) {
        if (!StringUtils.hasText(value)) {
            return fallback;
        }
        try {
            LocalTime time = LocalTime.parse(value);
            return TIME_FORMATTER.format(time);
        } catch (DateTimeParseException ex) {
            return fallback;
        }
    }

    private int sanitizeBreakMinutes(int value) {
        return value >= 0 ? value : DEFAULT_BREAK_MINUTES;
    }

    private String coalesceScheduleValue(String columnValue, JsonNode scheduleNode, String field, String defaultValue) {
        if (StringUtils.hasText(columnValue)) {
            return columnValue;
        }
        return textOrDefault(scheduleNode, field, defaultValue);
    }

    private int coalesceBreakMinutes(Integer columnValue, JsonNode scheduleNode) {
        if (columnValue != null && columnValue >= 0) {
            return columnValue;
        }
        return integerOrDefault(scheduleNode, "breakMinutes", DEFAULT_BREAK_MINUTES);
    }

    private record MetadataRow(
        String payload,
        String scheduleStart,
        String scheduleEnd,
        Integer scheduleBreakMinutes
    ) {}
}
