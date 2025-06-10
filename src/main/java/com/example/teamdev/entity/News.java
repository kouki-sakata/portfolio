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
 * お知らせ情報テーブル
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class News {
	/**
	 * ID
	 */
	private Integer id;
	/**
	 * お知らせ日時
	 */
	private String news_date;
	/**
	 * 内容
	 */
	private String content;
	/**
	 * 公開フラグ
	 */
	private boolean release_flag;
	/**
	 * 更新日時
	 */
	private Timestamp update_date;
}
