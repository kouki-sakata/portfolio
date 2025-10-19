package com.example.teamdev.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.teamdev.constant.AppConstants;
import com.example.teamdev.dto.api.home.HomeNewsItem;
import com.example.teamdev.entity.News;
import com.example.teamdev.mapper.NewsMapper;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class HomeNewsServiceTest {

    @Mock
    private NewsMapper newsMapper;

    private HomeNewsService service;

    @BeforeEach
    void setUp() {
        service = new HomeNewsService(newsMapper);
    }

    @DisplayName("公開済みニュースをHomeNewsItemに変換して返却する")
    @Test
    void executeReturnsHomeNewsItems() {
        News entity = new News(
            10,
            LocalDate.parse("2025-10-10"),
            "システムメンテナンスを実施します",
            true,
            Timestamp.from(Instant.parse("2025-10-09T12:34:56Z"))
        );
        when(newsMapper.getNewsByReleaseFlagTrueWithLimit(AppConstants.News.HOME_DISPLAY_LIMIT))
            .thenReturn(List.of(entity));

        List<HomeNewsItem> result = service.execute();

        assertThat(result)
            .hasSize(1)
            .first()
            .satisfies(item -> {
                assertThat(item.id()).isEqualTo(10);
                assertThat(item.content()).isEqualTo("システムメンテナンスを実施します");
                assertThat(item.newsDate()).isEqualTo("2025/10/10");
                assertThat(item.releaseFlag()).isTrue();
            });

        verify(newsMapper).getNewsByReleaseFlagTrueWithLimit(AppConstants.News.HOME_DISPLAY_LIMIT);
    }

    @DisplayName("releaseFlagがnullの場合は例外を送出する")
    @Test
    void executeThrowsWhenReleaseFlagIsNull() {
        News entity = new News(
            20,
            LocalDate.parse("2025-11-01"),
            "公開判定が不明なお知らせ",
            null,
            Timestamp.from(Instant.parse("2025-11-01T00:00:00Z"))
        );
        when(newsMapper.getNewsByReleaseFlagTrueWithLimit(AppConstants.News.HOME_DISPLAY_LIMIT))
            .thenReturn(List.of(entity));

        assertThatThrownBy(() -> service.execute())
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("news id=20");
    }
}
