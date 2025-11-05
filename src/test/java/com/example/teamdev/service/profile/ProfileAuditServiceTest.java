package com.example.teamdev.service.profile;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.teamdev.constant.AppConstants;
import com.example.teamdev.service.profile.model.ProfileChangeSet;
import com.example.teamdev.testconfig.PostgresContainerSupport;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("ProfileAuditService")
class ProfileAuditServiceTest extends PostgresContainerSupport {

    private static final int ACTOR_ID = 4100;
    private static final int TARGET_ID = 4200;

    private static final Instant FIXED_NOW = Instant.parse("2025-11-04T03:00:00Z");

    @Autowired
    private ProfileAuditService profileAuditService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @TestConfiguration
    static class FixedClockConfig {
        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(FIXED_NOW, ZoneOffset.UTC);
        }
    }

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM log_history");
        jdbcTemplate.update(
            "INSERT INTO employee (id, first_name, last_name, email, password, admin_flag, update_date, profile_metadata) "
                + "VALUES (?, '太郎', '管理者', 'audit.actor@example.com', '$2y$10$abcdefghijklmnopqrstuv', 1, CURRENT_TIMESTAMP, '{}'::jsonb) "
                + "ON CONFLICT (id) DO NOTHING",
            ACTOR_ID
        );
        jdbcTemplate.update(
            "INSERT INTO employee (id, first_name, last_name, email, password, admin_flag, update_date, profile_metadata) "
                + "VALUES (?, '次郎', '従業員', 'audit.target@example.com', '$2y$10$abcdefghijklmnopqrstuv', 0, CURRENT_TIMESTAMP, '{}'::jsonb) "
                + "ON CONFLICT (id) DO NOTHING",
            TARGET_ID
        );
    }

    @Test
    @DisplayName("プロフィール閲覧操作がログ履歴に記録される")
    void recordViewInsertsLogHistory() throws Exception {
        profileAuditService.recordView(ACTOR_ID, TARGET_ID);

        LogHistoryRecord record = jdbcTemplate.queryForObject(
            "SELECT display_name, operation_type, employee_id, update_employee_id, detail::text AS detail_json "
                + "FROM log_history ORDER BY id DESC LIMIT 1",
            (rs, rowNum) -> new LogHistoryRecord(
                rs.getInt("display_name"),
                rs.getInt("operation_type"),
                rs.getInt("employee_id"),
                rs.getInt("update_employee_id"),
                rs.getString("detail_json")
            )
        );

        assertThat(record).isNotNull();
        assertThat(record.displayName()).isEqualTo(AppConstants.LogHistory.FUNCTION_PROFILE);
        assertThat(record.operationType()).isEqualTo(AppConstants.LogHistory.OPERATION_PROFILE_VIEW);
        assertThat(record.employeeId()).isEqualTo(TARGET_ID);
        assertThat(record.updateEmployeeId()).isEqualTo(ACTOR_ID);

        JsonNode detail = objectMapper.readTree(record.detailJson());
        assertThat(detail.path("summary").asText()).isEqualTo("プロフィールを閲覧");
        assertThat(detail.path("changedFields")).isEmpty();
        assertThat(detail.path("before").size()).isEqualTo(0);
        assertThat(detail.path("after").size()).isEqualTo(0);
    }

    @Test
    @DisplayName("プロフィール更新操作で差分がdetail JSONに保存される")
    void recordUpdatePersistsDiffPayload() throws Exception {
        ProfileChangeSet changeSet = new ProfileChangeSet(
            List.of("department", "location"),
            Map.of("department", "開発部", "location", "東京"),
            Map.of("department", "未来戦略部", "location", "大阪"),
            "department・locationを更新"
        );

        Instant eventTime = Instant.parse("2025-11-04T09:15:00Z");
        profileAuditService.recordUpdate(ACTOR_ID, TARGET_ID, changeSet, eventTime);

        LogHistoryRecord record = jdbcTemplate.queryForObject(
            "SELECT display_name, operation_type, employee_id, update_employee_id, detail::text AS detail_json, update_date "
                + "FROM log_history ORDER BY id DESC LIMIT 1",
            (rs, rowNum) -> new LogHistoryRecord(
                rs.getInt("display_name"),
                rs.getInt("operation_type"),
                rs.getInt("employee_id"),
                rs.getInt("update_employee_id"),
                rs.getString("detail_json"),
                rs.getTimestamp("update_date").toInstant()
            )
        );

        assertThat(record).isNotNull();
        assertThat(record.operationType()).isEqualTo(AppConstants.LogHistory.OPERATION_PROFILE_UPDATE);
        assertThat(record.employeeId()).isEqualTo(TARGET_ID);
        assertThat(record.updateEmployeeId()).isEqualTo(ACTOR_ID);
        assertThat(record.updateDate()).isEqualTo(eventTime);

        JsonNode detail = objectMapper.readTree(record.detailJson());
        assertThat(detail.path("summary").asText()).isEqualTo("department・locationを更新");
        assertThat(detail.path("changedFields")).hasSize(2);
        assertThat(detail.path("changedFields").get(0).asText()).isEqualTo("department");
        assertThat(detail.path("before").get("department").asText()).isEqualTo("開発部");
        assertThat(detail.path("after").get("location").asText()).isEqualTo("大阪");
    }

    private record LogHistoryRecord(
        int displayName,
        int operationType,
        int employeeId,
        int updateEmployeeId,
        String detailJson,
        Instant updateDate
    ) {
        LogHistoryRecord(int displayName, int operationType, int employeeId, int updateEmployeeId, String detailJson) {
            this(displayName, operationType, employeeId, updateEmployeeId, detailJson, null);
        }
    }
}

