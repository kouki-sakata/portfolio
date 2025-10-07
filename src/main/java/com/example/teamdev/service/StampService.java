package com.example.teamdev.service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.teamdev.constant.AppConstants;
import com.example.teamdev.dto.api.home.StampType;
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
        StampType stampType = homeForm.getStampType();
        if (stampType == null) {
            throw new IllegalArgumentException("Stamp type must be provided");
        }
        int nightWorkFlag = Integer.parseInt(homeForm.getNightWorkFlag());

        //打刻時刻をTimestamp型に変換
        //homeForm.getStampTime(): yyyy-MM-ddTHH:mm:ss
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
        LocalDateTime dateTime = LocalDateTime.parse(homeForm.getStampTime(), formatter);
        Timestamp stampTime = Timestamp.valueOf(dateTime);

        //DBに登録するため、年月日分割
        Timestamp targetStampDate = stampTime;
        //退勤かつ夜勤打刻チェックがある場合は日を前日とする
        if (stampType == StampType.DEPARTURE && nightWorkFlag == 1) {
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

        if (stampType == StampType.ATTENDANCE) {
            entity.setInTime(stampTime);
        } else if (stampType == StampType.DEPARTURE) {
            entity.setOutTime(stampTime);
        }

        entity.setUpdateEmployeeId(employeeId);
        Timestamp date = Timestamp.valueOf(LocalDateTime.now());
        entity.setUpdateDate(date);

        // Upsert behavior portable across DBs:
        // If a record for (employeeId, year, month, day) exists, update it;
        // otherwise insert a new record. When updating, only set in/out time if not already present.
        StampHistory existing = mapper.getStampHistoryByYearMonthDayEmployeeId(year, month, day, employeeId);
        if (existing != null) {
            entity.setId(existing.getId());
            if (entity.getInTime() == null) {
                entity.setInTime(existing.getInTime());
            } else if (existing.getInTime() != null) {
                // Keep existing inTime if already set
                entity.setInTime(existing.getInTime());
            }
            if (entity.getOutTime() == null) {
                entity.setOutTime(existing.getOutTime());
            } else if (existing.getOutTime() != null) {
                // Keep existing outTime if already set
                entity.setOutTime(existing.getOutTime());
            }
            mapper.update(entity);
        } else {
            mapper.save(entity);
        }

        logHistoryService.execute(
            AppConstants.LogHistory.FUNCTION_STAMP,
            stampType.getLogHistoryOperationType(),
            stampTime,
            employeeId,
            employeeId,
            date
        );
    }
}
