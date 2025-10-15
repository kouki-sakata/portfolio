package com.example.teamdev.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.teamdev.entity.News;
import com.example.teamdev.mapper.NewsMapper;

/**
 * お知らせ管理サービス（REST層から利用）。
 * DataTables向けのレガシー処理は廃止し、公開API向けの取得ロジックのみを提供する。
 */
@Service
public class NewsManageService {

    @Autowired
    NewsMapper mapper;

    public List<News> getAllNews() {
        return mapper.getNewsOrderByNewsDateDesc();
    }

    public List<News> getPublishedNews() {
        return mapper.getNewsByReleaseFlagTrue();
    }

    public Optional<News> getById(Integer id) {
        return mapper.getById(id);
    }
}
