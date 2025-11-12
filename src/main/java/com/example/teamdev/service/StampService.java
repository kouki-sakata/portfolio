package com.example.teamdev.service;

import com.example.teamdev.constant.AppConstants;
import com.example.teamdev.dto.api.home.StampType;
import com.example.teamdev.entity.StampHistory;
import com.example.teamdev.exception.DuplicateStampException;
import com.example.teamdev.exception.InvalidStampStateException;
import com.example.teamdev.form.HomeForm;
import com.example.teamdev.mapper.StampHistoryMapper;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

        // 夜勤フラグを保存
        entity.setIsNightShift(nightWorkFlag == 1);

        entity.setUpdateEmployeeId(employeeId);
        OffsetDateTime date = OffsetDateTime.now(ZoneOffset.UTC);
        entity.setUpdateDate(date);

        // Upsert behavior portable across DBs:
        // If a record for (employeeId, year, month, day) exists, update it;
        // otherwise insert a new record. When updating, only set in/out time if not already present.
        StampHistory existing = mapper.getStampHistoryByYearMonthDayEmployeeId(year, month, day, employeeId);
        if (existing != null) {
            entity.setId(existing.getId());

            // 出勤打刻時: 状態チェック→重複チェックの順で実行
            if (stampType == StampType.ATTENDANCE) {
                // 状態チェック: 出勤済み＆退勤済みの場合は出勤打刻不可（重複チェックより優先）
                if (existing.getInTime() != null && existing.getOutTime() != null) {
                    throw new InvalidStampStateException("出勤打刻", "本日の勤務は既に終了しています");
                }
                // 重複チェック: 既存の inTime が設定済みなら上書き拒否
                if (existing.getInTime() != null) {
                    throw new DuplicateStampException("出勤", existing.getInTime().toString());
                }
                // 既存の outTime を保持
                entity.setOutTime(existing.getOutTime());
            }
            // 退勤打刻時: 既存の outTime が設定済みなら上書き拒否
            else if (stampType == StampType.DEPARTURE) {
                // 状態チェック: 出勤打刻がない場合はエラー
                if (existing.getInTime() == null) {
                    throw new InvalidStampStateException("退勤打刻", "出勤打刻が必要です");
                }
                if (existing.getOutTime() != null) {
                    throw new DuplicateStampException("退勤", existing.getOutTime().toString());
                }
                // 既存の inTime を保持
                entity.setInTime(existing.getInTime());
            }

            entity.setBreakStartTime(existing.getBreakStartTime());
            entity.setBreakEndTime(existing.getBreakEndTime());
            // 既存の夜勤フラグを保持（出勤時に設定されたものを維持）
            if (entity.getIsNightShift() == null) {
                entity.setIsNightShift(existing.getIsNightShift());
            }

            mapper.update(entity);
        } else {
            // レコードが存在しない場合: 退勤打刻は不正（出勤打刻が必要）
            if (stampType == StampType.DEPARTURE) {
                throw new InvalidStampStateException("退勤打刻", "出勤打刻が必要です");
            }
            entity.setBreakStartTime(null);
            entity.setBreakEndTime(null);
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

    public void toggleBreak(Integer employeeId, OffsetDateTime toggleTime) {
        Objects.requireNonNull(employeeId, "employeeId must not be null");
        Objects.requireNonNull(toggleTime, "toggleTime must not be null");

        LocalDate targetDate = toggleTime.toLocalDate();
        String year = String.format("%04d", targetDate.getYear());
        String month = String.format("%02d", targetDate.getMonthValue());
        String day = String.format("%02d", targetDate.getDayOfMonth());

        StampHistory existing = mapper.getStampHistoryByYearMonthDayEmployeeId(year, month, day, employeeId);
        OffsetDateTime updateDate = OffsetDateTime.now(ZoneOffset.UTC);

        // 状態チェック: 出勤打刻がない場合はエラー
        if (existing == null || existing.getInTime() == null) {
            throw new InvalidStampStateException("休憩操作", "出勤打刻が必要です");
        }

        // 状態チェック: 退勤打刻後はエラー
        if (existing.getOutTime() != null) {
            throw new InvalidStampStateException("休憩操作", "退勤後は休憩操作できません");
        }

        // 休憩時刻の更新
        StampHistory entity = new StampHistory();
        entity.setId(existing.getId());
        entity.setYear(year);
        entity.setMonth(month);
        entity.setDay(day);
        entity.setEmployeeId(employeeId);
        entity.setInTime(existing.getInTime());
        entity.setOutTime(existing.getOutTime());
        entity.setBreakStartTime(existing.getBreakStartTime());
        entity.setBreakEndTime(existing.getBreakEndTime());
        entity.setUpdateEmployeeId(employeeId);
        entity.setUpdateDate(updateDate);

        if (existing.getBreakStartTime() == null) {
            entity.setBreakStartTime(toggleTime);
        } else if (existing.getBreakEndTime() == null) {
            entity.setBreakEndTime(toggleTime);
        } else {
            throw new DuplicateStampException("休憩", existing.getBreakEndTime().toString());
        }

        mapper.update(entity);

        java.sql.Timestamp toggleTimestamp = java.sql.Timestamp.from(toggleTime.toInstant());
        java.sql.Timestamp updateTimestamp = java.sql.Timestamp.from(updateDate.toInstant());
        logHistoryService.execute(
            AppConstants.LogHistory.FUNCTION_STAMP,
            AppConstants.LogHistory.OPERATION_BREAK_TOGGLE,
            toggleTimestamp,
            employeeId,
            employeeId,
            updateTimestamp
        );
    }
}
