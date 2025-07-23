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
 * パフォーマンス最適化: ObjectMapperの再利用とストリーム処理
 */
@Service
public class LogHistoryQueryService{

	@Autowired
	LogHistoryMapper mapper;

	// ObjectMapperのインスタンスを再利用（スレッドセーフ）
	private final ObjectMapper objectMapper = new ObjectMapper();

	public List<Map<String,Object>> execute(String year, String month) {
		//更新日時がパラメータ年月と一致するレコードを更新日時降順で取得
		List<LogHistoryDisplay> logList = mapper.getLogHistoryByYearMonthOrderByUpdateDateDesc(year, month);
		
		// パフォーマンス最適化: ストリーム処理とObjectMapperの再利用
		return logList.stream()
				.map(log -> {
					@SuppressWarnings("unchecked")
					Map<String, Object> result = objectMapper.convertValue(log, Map.class);
					return result;
				})
				.toList();
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
