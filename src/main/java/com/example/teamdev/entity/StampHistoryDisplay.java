package com.example.teamdev.entity;

import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
/**
 * 打刻記録表示、出力
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StampHistoryDisplay {
	/**
	 * ID
	 */
	private Integer id;
	/**
	 * 年
	 */
	private String year;
	/**
	 * 月
	 */
	private String month;
	/**
	 * 日
	 */
	private String day;
	/**
	 * 曜日
	 */
	private String dayOfWeek;
	/**
	 * 従業員ID
	 */
	private Integer employeeId;
	/**
	 * 従業員氏名
	 */
	private String employeeName;
	/**
	 * 更新者氏名
	 */
	private String updateEmployeeName;
	/**
	 * 出勤時刻
	 */
	private String inTime;
	/**
	 * 退勤時刻
	 */
	private String outTime;
	/**
	 * 休憩開始時刻
	 */
	private String breakStartTime;
	/**
	 * 休憩終了時刻
	 */
	private String breakEndTime;
	/**
	 * 残業分数
	 */
	private Integer overtimeMinutes;
	/**
	 * 夜勤フラグ
	 */
	private Boolean isNightShift;
	/**
	 * 更新日時
	 */
	private String updateDate;
	/**
	 * 出勤時刻(生値)
	 */
	private OffsetDateTime inTimeRaw;
	/**
	 * 退勤時刻(生値)
	 */
	private OffsetDateTime outTimeRaw;
	/**
	 * 休憩開始時刻(生値)
	 */
	private OffsetDateTime breakStartTimeRaw;
	/**
	 * 休憩終了時刻(生値)
	 */
	private OffsetDateTime breakEndTimeRaw;

	/**
	 * CSV出力処理用
	 */
	public static String getCsvHeader() {
		return "ID,年,月,日,曜日,従業員ID,従業員氏名,更新者氏名,出勤時刻,退勤時刻,休憩開始時刻,休憩終了時刻,残業分,夜勤,更新日時\n";
	}

	public String toCsvString() {
		StringBuilder csvBuilder = new StringBuilder();
		csvBuilder.append(id != null ? id : "").append(",");
		csvBuilder.append("\"").append(year != null ? year : "").append("\",");
		csvBuilder.append("\"").append(month != null ? month : "").append("\",");
		csvBuilder.append("\"").append(day != null ? day : "").append("\",");
		csvBuilder.append("\"").append(dayOfWeek != null ? dayOfWeek : "").append("\",");
		csvBuilder.append(employeeId != null ? employeeId : "").append(",");
		csvBuilder.append("\"").append(employeeName != null ? employeeName : "").append("\",");
		csvBuilder.append("\"").append(updateEmployeeName != null ? updateEmployeeName : "").append("\",");
		csvBuilder.append("\"").append(inTime != null ? inTime : "").append("\",");
		csvBuilder.append("\"").append(outTime != null ? outTime : "").append("\",");
		csvBuilder.append("\"").append(breakStartTime != null ? breakStartTime : "").append("\",");
		csvBuilder.append("\"").append(breakEndTime != null ? breakEndTime : "").append("\",");
		csvBuilder.append(overtimeMinutes != null ? overtimeMinutes : 0).append(",");
		csvBuilder.append("\"").append(isNightShift == null ? "-" : (isNightShift ? "夜勤" : "通常")).append("\",");
		csvBuilder.append("\"").append(updateDate != null ? updateDate : "").append("\",");

		// 最後のカンマを削除して改行を追加
		csvBuilder.deleteCharAt(csvBuilder.length() - 1).append("\n");

		return csvBuilder.toString();
	}
}
