package com.example.teamdev.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.teamdev.constant.AppConstants;
import com.example.teamdev.dto.api.home.StampType;
import com.example.teamdev.entity.StampHistory;
import com.example.teamdev.exception.DuplicateStampException;
import com.example.teamdev.form.HomeForm;
import com.example.teamdev.mapper.StampHistoryMapper;

/**
 * ホーム画面
 * 打刻登録処理
 */
@Service
@Transactional
public class StampService {

    private final StampHistoryMapper mapper;
    private final LogHistoryRegistrationService logHistoryService;

    public StampService(StampHistoryMapper mapper, LogHistoryRegistrationService logHistoryService) {
        this.mapper = mapper;
        this.logHistoryService = logHistoryService;
    }

    public void execute(HomeForm homeForm, Integer employeeId) {
        StampType stampType = homeForm.getStampType();
        if (stampType == null) {
            throw new IllegalArgumentException("Stamp type must be provided");
        }
        int nightWorkFlag = Integer.parseInt(homeForm.getNightWorkFlag());

        //打刻時刻をOffsetDateTime型に変換
        //homeForm.getStampTime(): yyyy-MM-ddTHH:mm:ss+09:00 (ISO 8601形式、フロントエンドからタイムゾーン情報付きで送信)
        DateTimeFormatter formatter = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
        OffsetDateTime stampTime = OffsetDateTime.parse(homeForm.getStampTime(), formatter);
        // PostgreSQL TIMESTAMPTZ が自動的に UTC で保存

        //DBに登録するため、年月日分割
        LocalDate targetDate = stampTime.toLocalDate();
        //退勤かつ夜勤打刻チェックがある場合は日を前日とする
        if (stampType == StampType.DEPARTURE && nightWorkFlag == 1) {
            // 前日の日付を計算
            targetDate = targetDate.minusDays(1);
        }
        String year = String.format("%04d", targetDate.getYear());
        String month = String.format("%02d", targetDate.getMonthValue());
        String day = String.format("%02d", targetDate.getDayOfMonth());

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
        OffsetDateTime date = OffsetDateTime.now(ZoneOffset.UTC);
        entity.setUpdateDate(date);

        // Upsert behavior portable across DBs:
        // If a record for (employeeId, year, month, day) exists, update it;
        // otherwise insert a new record. When updating, only set in/out time if not already present.
        StampHistory existing = mapper.getStampHistoryByYearMonthDayEmployeeId(year, month, day, employeeId);
        if (existing != null) {
            entity.setId(existing.getId());

            // 出勤打刻時: 既存の inTime が設定済みなら上書き拒否
            if (stampType == StampType.ATTENDANCE) {
                if (existing.getInTime() != null) {
                    throw new DuplicateStampException("出勤", existing.getInTime().toString());
                }
                // 既存の outTime を保持
                entity.setOutTime(existing.getOutTime());
            }
            // 退勤打刻時: 既存の outTime が設定済みなら上書き拒否
            else if (stampType == StampType.DEPARTURE) {
                if (existing.getOutTime() != null) {
                    throw new DuplicateStampException("退勤", existing.getOutTime().toString());
                }
                // 既存の inTime を保持
                entity.setInTime(existing.getInTime());
            }

            mapper.update(entity);
        } else {
            mapper.save(entity);
        }

        // LogHistory は Timestamp を使用するため変換
        java.sql.Timestamp stampTimeForLog = java.sql.Timestamp.from(stampTime.toInstant());
        java.sql.Timestamp dateForLog = java.sql.Timestamp.from(date.toInstant());

        logHistoryService.execute(
            AppConstants.LogHistory.FUNCTION_STAMP,
            stampType.getLogHistoryOperationType(),
            stampTimeForLog,
            employeeId,
            employeeId,
            dateForLog
        );
    }
}
