package com.example.teamdev.service.profile;

import com.example.teamdev.constant.AppConstants;
import com.example.teamdev.service.profile.model.ProfileActivityEntry;
import com.example.teamdev.service.profile.model.ProfileActivityPage;
import com.example.teamdev.service.profile.model.ProfileActivityQuery;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * プロフィール活動履歴を取得するサービス。
 */
@Service
public class ProfileActivityQueryService {

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public ProfileActivityQueryService(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public ProfileActivityPage fetch(int employeeId, ProfileActivityQuery query) {
        int page = query.page();
        int size = query.size();
        int offset = page * size;

        SqlClause clause = buildClause(employeeId, query.from(), query.to());

        long total = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) " + clause.whereClause(),
            Long.class,
            clause.toParameterArray()
        );

        List<ProfileActivityEntry> items = jdbcTemplate.query(
            "SELECT lh.id, lh.update_date, lh.operation_type, lh.detail, "
                + "op.first_name as operator_first, op.last_name as operator_last "
                + "FROM log_history lh "
                + "LEFT JOIN employee op ON lh.update_employee_id = op.id "
                + clause.whereClause()
                + " ORDER BY lh.update_date DESC LIMIT ? OFFSET ?",
            new ActivityRowMapper(),
            clause.extendParams(size, offset)
        );

        int totalPages = (int) Math.ceil((double) total / size);
        return new ProfileActivityPage(page, size, totalPages, total, items);
    }

    private SqlClause buildClause(int employeeId, Optional<Instant> from, Optional<Instant> to) {
        StringBuilder builder = new StringBuilder("FROM log_history lh WHERE lh.display_name = ? AND lh.employee_id = ?");
        List<Object> params = new java.util.ArrayList<>();
        params.add(AppConstants.LogHistory.FUNCTION_PROFILE);
        params.add(employeeId);

        from.ifPresent(value -> {
            builder.append(" AND lh.update_date >= ?");
            params.add(Timestamp.from(value));
        });
        to.ifPresent(value -> {
            builder.append(" AND lh.update_date < ?");
            params.add(Timestamp.from(value));
        });

        return new SqlClause(builder.toString(), params);
    }

    private class ActivityRowMapper implements RowMapper<ProfileActivityEntry> {
        @Override
        public ProfileActivityEntry mapRow(ResultSet rs, int rowNum) throws SQLException {
            String id = rs.getString("id");
            Timestamp updateDate = rs.getTimestamp("update_date");
            int operationType = rs.getInt("operation_type");
            String detailJson = rs.getString("detail");
            String operatorFirst = rs.getString("operator_first");
            String operatorLast = rs.getString("operator_last");

            String occurredAt = updateDate != null
                ? ISO_FORMATTER.format(updateDate.toInstant().atOffset(ZoneOffset.UTC))
                : "";
            String actor = String.format(Locale.JAPANESE, "%s %s",
                defaultString(operatorLast),
                defaultString(operatorFirst)
            ).trim();
            if (!StringUtils.hasText(actor)) {
                actor = "不明なユーザー";
            }

            DetailPayload detail = parseDetail(detailJson);
            return new ProfileActivityEntry(
                id,
                occurredAt,
                operationType(operationType),
                actor,
                detail.summary,
                detail.changedFields,
                detail.beforeSnapshot,
                detail.afterSnapshot
            );
        }

        private DetailPayload parseDetail(String json) {
            if (!StringUtils.hasText(json)) {
                return new DetailPayload("プロフィール操作", List.of(), Collections.emptyMap(), Collections.emptyMap());
            }
            try {
                JsonNode node = objectMapper.readTree(json);
                String summary = node.path("summary").asText("プロフィール操作");
                List<String> changedFields = objectMapper.convertValue(
                    node.path("changedFields"),
                    new TypeReference<List<String>>() {}
                );
                Map<String, String> before = objectMapper.convertValue(
                    node.path("before"),
                    new TypeReference<Map<String, String>>() {}
                );
                Map<String, String> after = objectMapper.convertValue(
                    node.path("after"),
                    new TypeReference<Map<String, String>>() {}
                );
                return new DetailPayload(summary, changedFields, before, after);
            } catch (Exception ex) {
                return new DetailPayload("プロフィール操作", List.of(), Collections.emptyMap(), Collections.emptyMap());
            }
        }

        private String operationType(int code) {
            return switch (code) {
                case AppConstants.LogHistory.OPERATION_PROFILE_VIEW -> "VIEW";
                case AppConstants.LogHistory.OPERATION_PROFILE_UPDATE -> "UPDATE";
                default -> "UNKNOWN";
            };
        }

        private String defaultString(String value) {
            return value != null ? value : "";
        }
    }

    private record DetailPayload(
        String summary,
        List<String> changedFields,
        Map<String, String> beforeSnapshot,
        Map<String, String> afterSnapshot
    ) {}

    private record SqlClause(String whereClause, List<Object> params) {
        Object[] toParameterArray() {
            return params.toArray();
        }

        Object[] extendParams(int size, int offset) {
            List<Object> list = new java.util.ArrayList<>(params);
            list.add(size);
            list.add(offset);
            return list.toArray();
        }
    }
}
