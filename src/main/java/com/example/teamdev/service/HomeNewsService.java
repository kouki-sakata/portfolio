package com.example.teamdev.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.teamdev.constant.AppConstants;
import com.example.teamdev.dto.api.home.HomeNewsItem;
import com.example.teamdev.entity.News;
import com.example.teamdev.mapper.NewsMapper;
import com.example.teamdev.util.DateFormatUtil;

/**
 * ホーム画面
 * 画面情報取得処理
 */
@Service
public class HomeNewsService {

    private final NewsMapper mapper;

    public HomeNewsService(NewsMapper mapper) {
        this.mapper = mapper;
    }

    public List<HomeNewsItem> execute() {
        List<News> newsList = mapper.getNewsByReleaseFlagTrueWithLimit(
            AppConstants.News.HOME_DISPLAY_LIMIT
        );

        return newsList.stream()
            .map(this::toHomeNewsItem)
            .toList();
    }

    private HomeNewsItem toHomeNewsItem(News news) {
        Boolean releaseFlag = news.getReleaseFlag();
        if (releaseFlag == null) {
            throw new IllegalStateException("releaseFlag must not be null for news id=" + news.getId());
        }

        String formattedDate = DateFormatUtil.formatDate(news.getNewsDate());

        return new HomeNewsItem(
            news.getId(),
            news.getContent(),
            formattedDate,
            releaseFlag
        );
    }
}
