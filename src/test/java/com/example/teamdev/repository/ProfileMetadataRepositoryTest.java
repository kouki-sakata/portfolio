package com.example.teamdev.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.teamdev.service.profile.ProfileMetadataRepository;
import com.example.teamdev.service.profile.model.ProfileMetadataDocument;
import com.example.teamdev.service.profile.model.ProfileWorkScheduleDocument;
import com.example.teamdev.testconfig.PostgresContainerSupport;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.Timestamp;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@Tag("api")
class ProfileMetadataRepositoryTest extends PostgresContainerSupport {

    private static final int EMPLOYEE_ID = 9000;

    @Autowired
    private ProfileMetadataRepository repository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUpEmployee() {
        jdbcTemplate.update(
            "INSERT INTO employee (id, first_name, last_name, email, password, admin_flag, update_date) "
                + "VALUES (?, 'テスト', '従業員', 'profile@example.com', '$2y$10$abcdefghijklmnopqrstuv', 0, CURRENT_TIMESTAMP) "
                + "ON CONFLICT (id) DO NOTHING",
            EMPLOYEE_ID
        );
        jdbcTemplate.update("UPDATE employee SET profile_metadata = '{}'::jsonb WHERE id = ?", EMPLOYEE_ID);
    }

    @DisplayName("空のJSONBはデフォルト値に正規化される")
    @Test
    void loadShouldNormalizeEmptyMetadata() {
        ProfileMetadataDocument document = repository.load(EMPLOYEE_ID);

        assertThat(document.address()).isEmpty();
        assertThat(document.department()).isEmpty();
        assertThat(document.employeeNumber()).isEmpty();
        assertThat(document.activityNote()).isEmpty();
        assertThat(document.location()).isEmpty();
        assertThat(document.manager()).isEmpty();
        assertThat(document.workStyle()).isEqualTo("onsite");
        assertThat(document.schedule().start()).isEqualTo("09:00");
        assertThat(document.schedule().end()).isEqualTo("18:00");
        assertThat(document.schedule().breakMinutes()).isEqualTo(60);
        assertThat(document.status()).isEqualTo("active");
        assertThat(document.joinedAt()).isEmpty();
        assertThat(document.avatarUrl()).isEmpty();
    }

    @DisplayName("メタデータの保存でJSONBと更新日時が更新される")
    @Test
    void saveShouldPersistMetadataAndTouchTimestamp() throws Exception {
        ProfileMetadataDocument payload = new ProfileMetadataDocument(
            "東京都千代田区",
            "開発部",
            "EMP-9000",
            "新しい活動メモ",
            "東京/丸の内",
            "上長 一郎",
            "remote",
            new ProfileWorkScheduleDocument("10:00", "19:00", 45),
            "leave",
            "2024-04-01",
            "https://cdn.example.com/avatar.png"
        );

        repository.save(EMPLOYEE_ID, payload, Timestamp.from(Instant.parse("2025-11-04T03:00:00Z")));

        String storedJson = jdbcTemplate.queryForObject(
            "SELECT profile_metadata::text FROM employee WHERE id = ?",
            String.class,
            EMPLOYEE_ID
        );

        JsonNode root = objectMapper.readTree(storedJson);
        assertThat(root.path("address").asText()).isEqualTo("東京都千代田区");
        assertThat(root.path("workStyle").asText()).isEqualTo("remote");
        assertThat(root.path("status").asText()).isEqualTo("leave");
        assertThat(root.path("joinedAt").asText()).isEqualTo("2024-04-01");
        assertThat(root.path("avatarUrl").asText()).isEqualTo("https://cdn.example.com/avatar.png");
        assertThat(root.path("schedule").path("breakMinutes").asInt()).isEqualTo(45);

        Timestamp updatedAt = jdbcTemplate.queryForObject(
            "SELECT update_date FROM employee WHERE id = ?",
            Timestamp.class,
            EMPLOYEE_ID
        );

        assertThat(updatedAt).isNotNull();
        assertThat(updatedAt.toInstant()).isEqualTo(Instant.parse("2025-11-04T03:00:00Z"));

        ProfileMetadataDocument reloaded = repository.load(EMPLOYEE_ID);
        assertThat(reloaded.address()).isEqualTo("東京都千代田区");
        assertThat(reloaded.schedule().breakMinutes()).isEqualTo(45);
        assertThat(reloaded.status()).isEqualTo("leave");
    }
}
