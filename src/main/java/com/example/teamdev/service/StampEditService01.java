package com.example.teamdev.service;

import com.example.teamdev.entity.StampHistory;
import com.example.teamdev.mapper.StampHistoryMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;


/**
 * 打刻記録編集
 * 登録処理
 */
@Service
public class StampEditService01 {
    @Autowired
    StampHistoryMapper mapper;
    @Autowired
    LogHistoryService01 logHistoryService;

    // 年月日時刻の文字列を結合して、日時文字列をLocalDateTimeに変換
    public static LocalDateTime parseToLocalDateTime(String year, String month,
            String day, String time) {

        // 年月日時刻の文字列を結合して、日時文字列を作成
        String dateTimeString = year + "-" + month + "-" + day + " " + time;
        // 日時文字列をLocalDateTimeに変換
        LocalDateTime localDateTime = LocalDateTime.parse(dateTimeString,
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));

        return localDateTime;
    }

    public void execute(List<Map<String, Object>> StampEditList,
            int updateEmployeeId) {
        //カンマ区切り対策追記
        boolean save = false;
        for (Map<String, Object> stampEdit : StampEditList) {

            String stYear = stampEdit.get("year").toString();
            String stMonth = stampEdit.get("month").toString();
            String stDay = stampEdit.get("day").toString();
            String stInTime = stampEdit.get("inTime") != null ? stampEdit.get(
                    "inTime").toString() : null;
            String stOutTime = stampEdit.get("outTime") != null ? stampEdit.get(
                    "outTime").toString() : null;
            // カンマ区切り対策
            String employeeIdStr = stampEdit.get("employeeId").toString();
            if (employeeIdStr.contains(",")) {
                employeeIdStr = employeeIdStr.split(",")[0];
            }
            int employeeId = Integer.parseInt(employeeIdStr);

            //出勤時刻
            Timestamp timestampInTime = null;
            if (stInTime != null && !stInTime.isEmpty()) {
                // LocalDateTimeに変換
                LocalDateTime localDateTime = parseToLocalDateTime(stYear,
                        stMonth, stDay, stInTime);
                // LocalDateTimeからTimestampを作成
                timestampInTime = Timestamp.valueOf(localDateTime);
            }

            //退勤時刻
            Timestamp timestampOutTime = null;
            if (stOutTime != null && !stOutTime.isEmpty()) {
                // LocalDateTimeに変換
                LocalDateTime localDateTime = parseToLocalDateTime(stYear,
                        stMonth, stDay, stOutTime);
                // LocalDateTimeからTimestampを作成
                timestampOutTime = Timestamp.valueOf(localDateTime);
            }
            //退勤時刻の日付設定
            //出勤時刻>退勤時刻の場合は退勤時刻の日付を+1する
            if (timestampInTime != null) {
                if (timestampOutTime != null) {
                    // 出勤時刻が退勤時刻より前の場合は負の値、後の場合は正の値、同じ場合は0を返す
                    int comparison = timestampInTime.compareTo(
                            timestampOutTime);
                    //出勤時刻>退勤時刻
                    if (comparison > 0) {
                        // 1日を加算
                        LocalDateTime localDateTime = parseToLocalDateTime(
                                stYear, stMonth, stDay, stOutTime);
                        localDateTime = localDateTime.plusDays(1);
                        timestampOutTime = Timestamp.valueOf(localDateTime);
                    }
                }
            }
            String idString = stampEdit.get("id") != null ? stampEdit.get(
                    "id").toString() : "";
            Integer id = !idString.isEmpty() ? Integer.parseInt(
                    idString) : null;
            //idが格納されている場合は更新
            if (id != null) {
                StampHistory entity = mapper.getById(id).orElse(null);
                entity.setInTime(timestampInTime);
                entity.setOutTime(timestampOutTime);
                entity.setUpdateEmployeeId(
                        updateEmployeeId);
                mapper.update(entity);
                Timestamp timestamp = Timestamp.valueOf(LocalDateTime.now());
                entity.setUpdateDate(
                        timestamp);
                mapper.save(entity);
                save = true;
            } else {
                //idが格納されていない場合は新規登録
                StampHistory entity = new StampHistory();
                entity.setYear(stYear);
                entity.setMonth(stMonth);
                entity.setDay(stDay);
                entity.setMonth(stMonth);
                entity.setEmployeeId(employeeId);
                entity.setInTime(timestampInTime);
                entity.setOutTime(timestampOutTime);
                entity.setUpdateEmployeeId(updateEmployeeId);
                Timestamp timestamp = Timestamp.valueOf(LocalDateTime.now());
                entity.setUpdateDate(timestamp);
                mapper.save(entity);
                save = true;
            }
        }
        // 履歴記録
        if (save) {
            logHistoryService.execute(4, 3, null, Integer.parseInt(
                            StampEditList.get(0).get("employeeId").toString()),
                    updateEmployeeId, Timestamp.valueOf(LocalDateTime.now()));
        }
    }
}
