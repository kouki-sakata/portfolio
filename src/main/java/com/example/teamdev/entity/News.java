package com.example.teamdev.entity;

import java.sql.Timestamp;
import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * お知らせ情報エンティティ
 * <p>
 * データベーステーブル: news
 * </p>
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
	 * お知らせ日付
	 * <p>
	 * データベースカラム: news_date (DATE型)
	 * </p>
	 */
	@NotNull
	private LocalDate newsDate;

	/**
	 * 内容
	 * <p>
	 * データベースカラム: content (TEXT型, max 1000 characters)
	 * </p>
	 */
	@NotBlank
	@Size(max = 1000)
	private String content;

	/**
	 * 公開フラグ
	 * <p>
	 * データベースカラム: release_flag (BOOLEAN型)
	 * </p>
	 */
	@NotNull
	private Boolean releaseFlag;

	/**
	 * 更新日時
	 * <p>
	 * データベースカラム: update_date (TIMESTAMP型)
	 * </p>
	 */
	private Timestamp updateDate;
}
