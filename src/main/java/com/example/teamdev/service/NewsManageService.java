package com.example.teamdev.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.teamdev.entity.News;
import com.example.teamdev.mapper.NewsMapper;
import com.example.teamdev.util.DateFormatUtil;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * お知らせ管理
 * 画面情報取得処理
 */
@Service
public class NewsManageService{

	@Autowired
	NewsMapper mapper;

	public List<Map<String,Object>> execute() {

		List<Map<String,Object>>newsMapList = new ArrayList<Map<String,Object>>();
		Map<String, Object> newsMap = new HashMap<String, Object>();

		//お知らせ情報をお知らせ日付の降順で表示する
		List<News> newsList =  mapper.getNewsOrderByNewsDateDesc();
		for (News news : newsList) {
			//お知らせ情報をmapに詰め替え
			newsMap = new ObjectMapper().convertValue(news, Map.class);

			// Newsオブジェクトから日付を取得し、
			// 日付フォーマット変換（yyyy-MM-dd → yyyy/MM/dd）
			String formattedDate = DateFormatUtil.formatDate(news.getNews_date());
			newsMap.put("news_date", formattedDate);  // Mapにセット

			//Listに追加
			newsMapList.add(newsMap);
			}
		return newsMapList;
	}
}
