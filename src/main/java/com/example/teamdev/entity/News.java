package com.example.teamdev.entity;

import java.sql.Timestamp;
import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.example.teamdev.constant.AppConstants;

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
	 * タイトル
	 * <p>
	 * データベースカラム: title (VARCHAR(100))
	 * </p>
	 */
	@NotBlank
	@Size(max = AppConstants.News.TITLE_MAX_LENGTH)
	private String title;

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
	 * ラベル
	 * <p>
	 * データベースカラム: label (VARCHAR)
	 * </p>
	 */
	@NotBlank
	@Pattern(regexp = "^(IMPORTANT|SYSTEM|GENERAL)$")
	private String label;

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
