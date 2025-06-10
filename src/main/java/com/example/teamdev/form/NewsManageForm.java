/**
 * 2024/04/11 n.yasunari 新規作成
 * 2025/04/11 n.yasunari v1.0.1
 */
package com.example.teamdev.form;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @author n.yasunari
 * NewsManageForm
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NewsManageForm {
	
	/**
	 * ID
	 */
	private String id;
	/**
	 * お知らせ日時
	 */
	@NotBlank
	private String newsDate;
	/**
	 * 内容
	 */
	@NotBlank
	private String content;
}