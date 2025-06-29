package com.example.teamdev.entity;

import com.example.teamdev.constant.DisplayName;
import com.example.teamdev.constant.OperationType;
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
	 * 画面名 (コード値)
	 */
	private Integer display_name_code; // 新しいフィールド
	/**
	 * 履歴種別 (コード値)
	 */
	private Integer operation_type_code; // 新しいフィールド
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

	// display_name_codeから名前を取得するgetter
	public String getDisplay_name() {
		return DisplayName.getNameByCode(this.display_name_code);
	}

	// operation_type_codeから名前を取得するgetter
	public String getOperation_type() {
		return OperationType.getNameByCode(this.operation_type_code);
	}
}
