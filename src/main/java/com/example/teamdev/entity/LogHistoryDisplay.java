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
	private String updateDate;
	/**
	 * 画面名 (コード値)
	 */
	private Integer displayNameCode;
	/**
	 * 履歴種別 (コード値)
	 */
	private Integer operationTypeCode;
	/**
	 * 打刻時刻
	 */
	private String stampTime;
	/**
	 * 従業員氏名
	 */
	private String employeeName;
	/**
	 * 更新者氏名
	 */
	private String updateEmployeeName;

	// displayNameCodeから名前を取得するgetter
	public String getDisplayName() {
		return DisplayName.getNameByCode(this.displayNameCode);
	}

	// operationTypeCodeから名前を取得するgetter
	public String getOperationType() {
		return OperationType.getNameByCode(this.operationTypeCode);
	}
}
