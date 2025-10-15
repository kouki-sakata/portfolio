package com.example.teamdev.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.teamdev.entity.StampHistoryDisplay;
import com.example.teamdev.mapper.StampHistoryMapper;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * 打刻記録確認
 * 画面情報取得処理
 */
@Service
public class StampHistoryService{

	@Autowired
	StampHistoryMapper mapper;

	@Autowired
	private ObjectMapper objectMapper;

	//打刻記録取得
	public List<Map<String,Object>> execute(String year, String month, int employeeId) {

		List<Map<String,Object>>stampHistoryMapList = new ArrayList<Map<String,Object>>();
		Map<String, Object> stampHistoryMap = new HashMap<String, Object>();

		// 対象年月のすべての日付を生成
        List<LocalDate> datesInMonth = new ArrayList<>();
        LocalDate startDate = LocalDate.of(Integer.parseInt(year), Integer.parseInt(month), 1);
        LocalDate endDate = startDate.plusMonths(1).minusDays(1);
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            datesInMonth.add(date);
        }

		//対象年月・従業員IDの打刻記録をカレンダー形式で取得する
		//形式：year(YYYY),month(MM),startDate(YYYYMM01)
		List<StampHistoryDisplay> stampHistoryList =
				mapper.getStampHistoryByYearMonthEmployeeId(year, month, employeeId, datesInMonth);
		for (StampHistoryDisplay stampHistory : stampHistoryList) {
			//取得した打刻記録をmapに詰め替え
			stampHistoryMap = objectMapper.convertValue(stampHistory, Map.class);
			//Listに追加
			stampHistoryMapList.add(stampHistoryMap);
        }
		return stampHistoryMapList;
	}

	//年リスト取得
	public List<String> getYearList() {

		// システム日付の属する年-1, システム日付の属する年, システム日付の属する年+1
		int targetYear = LocalDate.now().getYear();

        // 結果を格納するリスト
        List<String> yearList = new ArrayList<>();

        // ターゲットの年の前後1年をリストに追加
        for (int i = targetYear - 1; i <= targetYear + 1; i++) {
            yearList.add(String.valueOf(i));
        }
		return yearList;
	}
	//月リスト取得
	public List<String> getMonthList() {

        // 結果を格納するリスト
        List<String> monthList = new ArrayList<>();

        // 01～12（ゼロ埋め）
        for (int i = 1; i <= 12; i++) {
        	monthList.add(String.format("%02d", i));
        }
		return monthList;
	}
}
