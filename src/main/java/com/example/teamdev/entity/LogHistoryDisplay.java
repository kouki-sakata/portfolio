package com.example.teamdev.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 履歴確認表示
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LogHistoryDisplay {
	/**
	 * 更新日時
	 */
	private String update_date;
	/**
	 * 画面名
	 */
	private String display_name;
	/**
	 * 履歴種別
	 */
	private String operation_type;
	/**
	 * 打刻時刻
	 */
	private String stamp_time;
	/**
	 * 従業員氏名
	 */
	private String employee_name;
	/**
	 * 更新者氏名
	 */
	private String update_employee_name;
}
