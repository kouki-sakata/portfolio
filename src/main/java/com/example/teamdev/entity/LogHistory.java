/**
 * 2024/03/21 n.yasunari 新規作成
 * 2025/04/11 n.yasunari v1.0.1
 */
package com.example.teamdev.entity;

import java.sql.Timestamp;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @author n.yasunari
 * 履歴記録テーブル
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LogHistory {
	/**
	 * ID
	 */
	private Integer id;
	/**
	 * 画面名
	 */
	private Integer display_name;
	/**
	 * 履歴種別
	 */
	private Integer operation_type;
	/**
	 * 打刻時刻
	 */
	private Timestamp stamp_time;
	/**
	 * 従業員ID
	 */
	private Integer employee_id;
	/**
	 * 更新従業員ID
	 */
	private Integer update_employee_id;
	/**
	 * 更新日時
	 */
	private Timestamp update_date;
}
