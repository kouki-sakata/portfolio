package com.example.teamdev.entity;

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
	private String day_of_week;
	/**
	 * 従業員ID
	 */
	private Integer employee_id;
	/**
	 * 従業員氏名
	 */
	private String employee_name;
	/**
	 * 更新者氏名
	 */
	private String update_employee_name;
	/**
	 * 出勤時刻
	 */
	private String in_time;
	/**
	 * 退勤時刻
	 */
	private String out_time;
	/**
	 * 更新日時
	 */
	private String update_date;

	/**
	 * CSV出力処理用
	 */
	public static String getCsvHeader() {
		return "ID,年,月,日,曜日,従業員ID,従業員氏名,更新者氏名,出勤時刻,退勤時刻,更新日時\n";
	}

	public String toCsvString() {
		StringBuilder csvBuilder = new StringBuilder();
		csvBuilder.append(id != null ? id : "").append(",");
		csvBuilder.append("\"").append(year != null ? year : "").append("\",");
		csvBuilder.append("\"").append(month != null ? month : "").append("\",");
		csvBuilder.append("\"").append(day != null ? day : "").append("\",");
		csvBuilder.append("\"").append(day_of_week != null ? day_of_week : "").append("\",");
		csvBuilder.append(employee_id != null ? employee_id : "").append(",");
		csvBuilder.append("\"").append(employee_name != null ? employee_name : "").append("\",");
		csvBuilder.append("\"").append(update_employee_name != null ? update_employee_name : "").append("\",");
		csvBuilder.append("\"").append(in_time != null ? in_time : "").append("\",");
		csvBuilder.append("\"").append(out_time != null ? out_time : "").append("\",");
		csvBuilder.append("\"").append(update_date != null ? update_date : "").append("\",");

		// 最後のカンマを削除して改行を追加
		csvBuilder.deleteCharAt(csvBuilder.length() - 1).append("\n");

		return csvBuilder.toString();
	}
}
