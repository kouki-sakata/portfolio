package com.example.teamdev.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.teamdev.entity.News;
import com.example.teamdev.form.NewsManageForm;
import com.example.teamdev.mapper.NewsMapper;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NewsManageRegistrationServiceTest {

    @Mock
    NewsMapper mapper;

    @Mock
    LogHistoryRegistrationService logHistoryService;

    Clock fixedClock;

    NewsManageRegistrationService service;

    @BeforeEach
    void setUp() {
        fixedClock = Clock.fixed(Instant.parse("2025-10-30T12:34:56Z"), ZoneOffset.UTC);
        service = new NewsManageRegistrationService(mapper, logHistoryService, fixedClock);
    }

    @DisplayName("新規登録時にフォームの公開状態・タイトル・ラベルを保存する")
    @Test
    void executeCreatesNewsWithProvidedAttributes() {
        NewsManageForm form = new NewsManageForm(
            "",
            "2025-11-01",
            "メンテナンス告知",
            "本文を更新しました",
            "IMPORTANT",
            true
        );

        when(mapper.save(any(News.class))).thenAnswer(invocation -> {
            News entity = invocation.getArgument(0, News.class);
            entity.setId(123);
            return 1;
        });

        News result = service.execute(form, 200);

        ArgumentCaptor<News> captor = ArgumentCaptor.forClass(News.class);
        verify(mapper).save(captor.capture());
        News saved = captor.getValue();

        assertThat(saved.getId()).isEqualTo(123);
        assertThat(saved.getNewsDate()).isEqualTo(LocalDate.parse("2025-11-01"));
        assertThat(saved.getTitle()).isEqualTo("メンテナンス告知");
        assertThat(saved.getContent()).isEqualTo("本文を更新しました");
        assertThat(saved.getLabel()).isEqualTo("IMPORTANT");
        assertThat(saved.getReleaseFlag()).isTrue();
        assertThat(saved.getUpdateDate()).isEqualTo(Timestamp.from(fixedClock.instant()));

        assertThat(result.getTitle()).isEqualTo("メンテナンス告知");
        assertThat(result.getLabel()).isEqualTo("IMPORTANT");
        assertThat(result.getReleaseFlag()).isTrue();

        verify(logHistoryService).execute(2, 3, null, null, 200, Timestamp.from(fixedClock.instant()));
    }

    @DisplayName("既存ニュースを更新する際に公開状態・タイトル・ラベルを反映する")
    @Test
    void executeUpdatesExistingNewsWithNewAttributes() {
        News existing = new News();
        existing.setId(55);
        existing.setNewsDate(LocalDate.parse("2025-10-15"));
        existing.setTitle("旧タイトル");
        existing.setContent("旧コンテンツ");
        existing.setLabel("GENERAL");
        existing.setReleaseFlag(false);
        existing.setUpdateDate(Timestamp.from(Instant.parse("2025-10-20T00:00:00Z")));

        when(mapper.getById(55)).thenReturn(Optional.of(existing));

        NewsManageForm form = new NewsManageForm(
            "55",
            "2025-11-05",
            "新しいタイトル",
            "新しいコンテンツ",
            "SYSTEM",
            true
        );

        News result = service.execute(form, 300);

        ArgumentCaptor<News> captor = ArgumentCaptor.forClass(News.class);
        verify(mapper).upDate(captor.capture());
        verify(mapper, never()).save(any(News.class));

        News updated = captor.getValue();
        assertThat(updated.getId()).isEqualTo(55);
        assertThat(updated.getNewsDate()).isEqualTo(LocalDate.parse("2025-11-05"));
        assertThat(updated.getTitle()).isEqualTo("新しいタイトル");
        assertThat(updated.getContent()).isEqualTo("新しいコンテンツ");
        assertThat(updated.getLabel()).isEqualTo("SYSTEM");
        assertThat(updated.getReleaseFlag()).isTrue();
        assertThat(updated.getUpdateDate()).isEqualTo(Timestamp.from(fixedClock.instant()));

        assertThat(result.getTitle()).isEqualTo("新しいタイトル");
        assertThat(result.getLabel()).isEqualTo("SYSTEM");
        assertThat(result.getReleaseFlag()).isTrue();

        verify(logHistoryService).execute(2, 3, null, null, 300, Timestamp.from(fixedClock.instant()));
    }

    @DisplayName("ラベル未指定と公開フラグnullの場合に既定値を適用する")
    @Test
    void executeDefaultsLabelAndReleaseFlagWhenNotProvided() {
        NewsManageForm form = new NewsManageForm(
            "",
            "2025-11-10",
            "告知タイトル",
            "内容本文",
            null,
            null
        );

        when(mapper.save(any(News.class))).thenAnswer(invocation -> {
            News entity = invocation.getArgument(0, News.class);
            entity.setId(777);
            return 1;
        });

        News result = service.execute(form, 400);

        ArgumentCaptor<News> captor = ArgumentCaptor.forClass(News.class);
        verify(mapper).save(captor.capture());
        News saved = captor.getValue();

        assertThat(saved.getLabel()).isEqualTo("GENERAL");
        assertThat(saved.getReleaseFlag()).isFalse();

        assertThat(result.getLabel()).isEqualTo("GENERAL");
        assertThat(result.getReleaseFlag()).isFalse();
    }
}
