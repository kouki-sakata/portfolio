package com.example.teamdev.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.teamdev.entity.LogHistoryDisplay;
import com.example.teamdev.mapper.LogHistoryMapper;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * 履歴確認
 * 画面情報取得処理
 */
@Service
public class LogHistoryService02{

	@Autowired
	LogHistoryMapper mapper;

	public List<Map<String,Object>> execute(String year, String month) {

		List<Map<String,Object>> logMapList = new ArrayList<Map<String,Object>>();
		Map<String, Object> logMap = new HashMap<String, Object>();

		//更新日時がパラメータ年月と一致するレコードを更新日時降順で取得
		List<LogHistoryDisplay> logList =  mapper.getLogHistoryByYearMonthOrderByUpdateDateDesc(year, month);
		for (LogHistoryDisplay log : logList) {
			//mapに詰め替え
			logMap = new ObjectMapper().convertValue(log, Map.class);
			//Listに追加
			logMapList.add(logMap);
        }
		return logMapList;
	}

	//履歴記録が存在するすべての年リスト取得(＋システム日付の属する年)
	public List<String> getYearList() {

        List<String> yearList = mapper.getLogHistoryYearOrderByYearAsc();
        LocalDate currentDate = LocalDate.now();
        String year = String.valueOf(currentDate.getYear());
        // yearListに現在の年が含まれていない場合、追加する
        if (!yearList.contains(year)) {
            yearList.add(year);
        }
		return yearList;
	}
}
