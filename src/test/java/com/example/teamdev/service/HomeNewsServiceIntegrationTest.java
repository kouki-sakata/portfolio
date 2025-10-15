package com.example.teamdev.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.teamdev.entity.News;
import com.example.teamdev.mapper.NewsMapper;
import com.example.teamdev.testconfig.PostgresContainerSupport;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * HomeNewsServiceの実データベース統合テスト。
 *
 * <p>Testcontainersで起動したPostgreSQLに対して実際のNewsMapperを使用し、
 * releaseFlagのキャメルケース/スネークケース両方のキーがレスポンスに含まれることを検証する。</p>
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class HomeNewsServiceIntegrationTest extends PostgresContainerSupport {

    @Autowired
    private HomeNewsService homeNewsService;

    @Autowired
    private NewsMapper newsMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM news");
    }

    @DisplayName("executeはreleaseFlagとrelease_flagの両方を含む公開ニュースのみを返す")
    @Test
    void execute_shouldIncludeCamelAndSnakeCaseReleaseFlagKeys() {
        News released = new News();
        released.setNewsDate(LocalDate.of(2025, 1, 1));
        released.setContent("Integration test news");
        released.setReleaseFlag(true);
        released.setUpdateDate(Timestamp.from(Instant.now()));
        newsMapper.save(released);

        News hidden = new News();
        hidden.setNewsDate(LocalDate.of(2025, 1, 2));
        hidden.setContent("Hidden news");
        hidden.setReleaseFlag(false);
        hidden.setUpdateDate(Timestamp.from(Instant.now()));
        newsMapper.save(hidden);

        List<Map<String, Object>> results = homeNewsService.execute();

        assertThat(results)
            .hasSize(1)
            .first()
            .satisfies(map -> {
                assertThat(map).containsEntry("releaseFlag", true);
                assertThat(map).containsEntry("release_flag", true);
                assertThat(map).containsKey("news_date");
            });
    }
}
