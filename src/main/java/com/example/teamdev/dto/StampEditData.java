package com.example.teamdev.dto;

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
    private final String inTime;
    private final String outTime;

    /**
     * StampEditDataのコンストラクタ。
     *
     * @param id         打刻履歴ID（新規登録時はnull）
     * @param employeeId 従業員ID
     * @param year       年
     * @param month      月
     * @param day        日
     * @param inTime     出勤時刻
     * @param outTime    退勤時刻
     */
    public StampEditData(Integer id, Integer employeeId, String year,
            String month, String day, String inTime, String outTime) {
        this.id = id;
        this.employeeId = employeeId;
        this.year = year;
        this.month = month;
        this.day = day;
        this.inTime = inTime;
        this.outTime = outTime;
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

    public String getInTime() {
        return inTime;
    }

    public String getOutTime() {
        return outTime;
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