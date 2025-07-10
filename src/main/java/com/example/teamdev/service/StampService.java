package com.example.teamdev.service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.teamdev.entity.StampHistory;
import com.example.teamdev.form.HomeForm;
import com.example.teamdev.mapper.StampHistoryMapper;

/**
 * ホーム画面
 * 打刻登録処理
 */
@Service
@Transactional
public class StampService {

	@Autowired
	StampHistoryMapper mapper;
	@Autowired
	    LogHistoryRegistrationService logHistoryService;

	public void execute(HomeForm homeForm, Integer employeeId) {

		int stampType = Integer.parseInt(homeForm.getStampType());
		int nightWorkFlag = Integer.parseInt(homeForm.getNightWorkFlag());

		//打刻時刻をTimestamp型に変換
		//homeForm.getStampTime(): yyyy-MM-ddTHH:mm:ss
		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
		LocalDateTime dateTime = LocalDateTime.parse(homeForm.getStampTime(), formatter);
		Timestamp stampTime = Timestamp.valueOf(dateTime);

		//DBに登録するため、年月日分割
		Timestamp targetStampDate = stampTime;
		//退勤かつ夜勤打刻チェックがある場合は日を前日とする
		if (stampType == 2 && nightWorkFlag == 1) {
			// stampTimeからLocalDateTimeを取得
			LocalDateTime localDateTime = stampTime.toLocalDateTime();
			// 前日の日付を計算
			LocalDateTime previousDay = localDateTime.minusDays(1);
			targetStampDate = Timestamp.valueOf(previousDay);
		}
		String targetTime = targetStampDate.toString();
		// targetTime: yyyy-MM-dd　HH:mm:ss
		// 空白文字を区切り文字として文字列を分割
		String[] parts = targetTime.split("\\s+");
		// 日付部分を "-" で分割して、年月日を取得
		String[] dateParts = parts[0].split("-");
		String year = dateParts[0];
		String month = dateParts[1];
		String day = dateParts[2];

		StampHistory entity = new StampHistory();
		entity.setYear(year);
		entity.setMonth(month);
		entity.setDay(day);
		entity.setEmployeeId(employeeId);

		if (stampType == 1) {
			entity.setInTime(stampTime);
		} else if (stampType == 2) {
			entity.setOutTime(stampTime);
		}

		entity.setUpdateEmployeeId(employeeId);
		Timestamp date = Timestamp.valueOf(LocalDateTime.now());
		entity.setUpdateDate(date);

		mapper.save(entity);
		logHistoryService.execute(1, stampType, stampTime, employeeId, employeeId, date);
	}
}
