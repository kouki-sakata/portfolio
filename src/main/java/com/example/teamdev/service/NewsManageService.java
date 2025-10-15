package com.example.teamdev.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.teamdev.dto.DataTablesRequest;
import com.example.teamdev.dto.DataTablesResponse;
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

	@Autowired
	private ObjectMapper objectMapper;

	public List<Map<String,Object>> execute() {

		List<Map<String,Object>>newsMapList = new ArrayList<Map<String,Object>>();
		Map<String, Object> newsMap = new HashMap<String, Object>();

		//お知らせ情報をお知らせ日付の降順で表示する
		List<News> newsList =  mapper.getNewsOrderByNewsDateDesc();
		for (News news : newsList) {
			//お知らせ情報をmapに詰め替え
			newsMap = objectMapper.convertValue(news, Map.class);

			// Newsオブジェクトから日付を取得し、
			// 日付フォーマット変換（yyyy-MM-dd → yyyy/MM/dd）
			String formattedDate = DateFormatUtil.formatDate(news.getNewsDate());
			newsMap.put("news_date", formattedDate);  // Mapにセット

			//Listに追加
			newsMapList.add(newsMap);
			}
		return newsMapList;
	}

	public DataTablesResponse<Map<String, Object>> getNewsForDataTables(DataTablesRequest request) {
		// すべてのお知らせ情報を取得
		List<News> allNews = mapper.getNewsOrderByNewsDateDesc();
		
		// レスポンス用のデータリストを作成
		List<Map<String, Object>> newsDataList = new ArrayList<>();
		
		for (News news : allNews) {
			Map<String, Object> newsData = new HashMap<>();
			newsData.put("id", news.getId());
			newsData.put("news_date", DateFormatUtil.formatDate(news.getNewsDate()));
			newsData.put("content", news.getContent());
			newsData.put("release_flag", news.getReleaseFlag());
			newsDataList.add(newsData);
		}
		
		// DataTablesResponse を作成
		DataTablesResponse<Map<String, Object>> response = new DataTablesResponse<>();
		response.setDraw(request.getDraw());
		response.setRecordsTotal(newsDataList.size());
		response.setRecordsFiltered(newsDataList.size());
		response.setData(newsDataList);
		
		return response;
	}
}
