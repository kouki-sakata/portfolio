package com.example.teamdev.dto;

import java.time.LocalDate;

/**
 * 打刻編集データを保持するDTOクラス。
 * フォームデータから抽出した値を構造化して保持します。
 * 単一責任の原則に従い、データ転送のみを責務とします。
 */
public class StampEditData {
    private final Integer id;
    private final Integer employeeId;
    private final String year;
    private final String month;
    private final String day;
    private final LocalDate stampDate;
    private final String inTime;
    private final String outTime;
    private final String breakStartTime;
    private final String breakEndTime;
    private final Boolean isNightShift;

    /**
     * StampEditDataのコンストラクタ。
     *
     * @param id             打刻履歴ID（新規登録時はnull）
     * @param employeeId     従業員ID
     * @param year           年
     * @param month          月
     * @param day            日
     * @param stampDate      打刻日付（YYYY-MM-DD形式）
     * @param inTime         出勤時刻
     * @param outTime        退勤時刻
     * @param breakStartTime 休憩開始時刻
     * @param breakEndTime   休憩終了時刻
     * @param isNightShift   夜勤フラグ
     */
    public StampEditData(Integer id, Integer employeeId, String year,
            String month, String day, LocalDate stampDate, String inTime, String outTime,
            String breakStartTime, String breakEndTime, Boolean isNightShift) {
        this.id = id;
        this.employeeId = employeeId;
        this.year = year;
        this.month = month;
        this.day = day;
        this.stampDate = stampDate;
        this.inTime = inTime;
        this.outTime = outTime;
        this.breakStartTime = breakStartTime;
        this.breakEndTime = breakEndTime;
        this.isNightShift = isNightShift;
    }

    // Getters
    public Integer getId() {
        return id;
    }

    public Integer getEmployeeId() {
        return employeeId;
    }

    public String getYear() {
        return year;
    }

    public String getMonth() {
        return month;
    }

    public String getDay() {
        return day;
    }

    public LocalDate getStampDate() {
        return stampDate;
    }

    public String getInTime() {
        return inTime;
    }

    public String getOutTime() {
        return outTime;
    }

    public String getBreakStartTime() {
        return breakStartTime;
    }

    public String getBreakEndTime() {
        return breakEndTime;
    }

    public Boolean getIsNightShift() {
        return isNightShift;
    }

    /**
     * 新規登録かどうかを判定します。
     *
     * @return IDがnullの場合true（新規登録）
     */
    public boolean isNewEntry() {
        return id == null;
    }

    /**
     * 出勤時刻が設定されているか確認します。
     *
     * @return 出勤時刻が設定されている場合true
     */
    public boolean hasInTime() {
        return inTime != null && !inTime.isEmpty();
    }

    /**
     * 退勤時刻が設定されているか確認します。
     *
     * @return 退勤時刻が設定されている場合true
     */
    public boolean hasOutTime() {
        return outTime != null && !outTime.isEmpty();
    }
}