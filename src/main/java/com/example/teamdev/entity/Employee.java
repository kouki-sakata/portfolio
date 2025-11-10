package com.example.teamdev.entity;

import java.sql.Timestamp;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 従業員情報テーブル
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Employee {
	/**
	 * ID
	 */
	private Integer id;
	/**
	 * 名（given name）
	 */
	private String firstName;
	/**
	 * 姓（family name）
	 */
	private String lastName;
	/**
	 * メールアドレス
	 */
	private String email;
	/**
	 * パスワード
	 */
	private String password;
	/**
	 * 管理者フラグ
	 */
	private Integer adminFlag;
	/**
	 * 更新日時
	 */
	private Timestamp updateDate;
}
