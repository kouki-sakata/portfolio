/**
 * 2024/03/20 n.yasunari 新規作成
 * 2025/04/11 n.yasunari v1.0.1
 */
package com.example.teamdev.entity;

import java.sql.Timestamp;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @author n.yasunari
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
	 * 姓
	 */
	private String first_name;
	/**
	 * 名
	 */
	private String last_name;
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
	private Integer admin_flag;
	/**
	 * 更新日時
	 */
	private Timestamp update_date;
}
