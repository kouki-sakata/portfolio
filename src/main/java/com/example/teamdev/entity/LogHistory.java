package com.example.teamdev.entity;

import java.sql.Timestamp;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 履歴記録テーブル
 *
 * Note: TIMESTAMP WITHOUT TIME ZONE を使用（stamp_time, update_date）
 * 既存のスキーマとの互換性維持のため Timestamp を使用
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
	private Integer displayName;
	/**
	 * 履歴種別
	 */
	private Integer operationType;
	/**
	 * 打刻時刻
	 */
	private Timestamp stampTime;
	/**
	 * 従業員ID
	 */
	private Integer employeeId;
	/**
	 * 更新従業員ID
	 */
    private Integer updateEmployeeId;
    /**
     * 更新日時
     */
    private Timestamp updateDate;
    /**
     * 詳細JSON
     */
    private String detail;
}
