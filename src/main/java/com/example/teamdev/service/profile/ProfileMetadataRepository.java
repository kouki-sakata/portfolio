package com.example.teamdev.service.profile;

import com.example.teamdev.service.profile.model.ProfileMetadataDocument;
import com.example.teamdev.service.profile.model.ProfileWorkScheduleDocument;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Objects;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * employee.profile_metadata JSONB カラムを扱うリポジトリ。
 */
@Repository
public class ProfileMetadataRepository {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public ProfileMetadataRepository(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * プロフィールメタデータを取得します。
     */
    public ProfileMetadataDocument load(int employeeId) {
        String json = jdbcTemplate.query(
            "SELECT COALESCE(profile_metadata::text, '{}') FROM employee WHERE id = ?",
            ps -> ps.setInt(1, employeeId),
            rs -> rs.next() ? rs.getString(1) : null
        );

        if (json == null) {
            throw new IllegalArgumentException("Employee not found for id=" + employeeId);
        }

        try {
            JsonNode root = objectMapper.readTree(json);
            return toDocument(root);
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
        try {
            payload = objectMapper.writeValueAsString(toJson(document));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize profile metadata", e);
        }

        int updated = jdbcTemplate.update(
            "UPDATE employee SET profile_metadata = CAST(? AS jsonb), update_date = ? WHERE id = ?",
            payload,
            updatedAt != null ? updatedAt : Timestamp.from(Instant.now()),
            employeeId
        );
        if (updated == 0) {
            throw new IllegalArgumentException("Employee not found for id=" + employeeId);
        }
    }

    private ProfileMetadataDocument toDocument(JsonNode root) {
        if (root == null || root.isMissingNode()) {
            return defaultDocument();
        }
        return new ProfileMetadataDocument(
            text(root, "address"),
            text(root, "department"),
            text(root, "employeeNumber"),
            text(root, "activityNote"),
            text(root, "location"),
            text(root, "manager"),
            textOrDefault(root, "workStyle", "onsite"),
            new ProfileWorkScheduleDocument(
                textOrDefault(root.path("schedule"), "start", "09:00"),
                textOrDefault(root.path("schedule"), "end", "18:00"),
                integerOrDefault(root.path("schedule"), "breakMinutes", 60)
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

        com.fasterxml.jackson.databind.node.ObjectNode schedule = objectMapper.createObjectNode();
        schedule.put("start", safe(document.schedule().start()));
        schedule.put("end", safe(document.schedule().end()));
        schedule.put("breakMinutes", document.schedule().breakMinutes());
        root.set("schedule", schedule);
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
            new ProfileWorkScheduleDocument("09:00", "18:00", 60),
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
}
