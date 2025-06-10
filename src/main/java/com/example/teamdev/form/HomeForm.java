/**
 * 2024/03/29 n.yasunari 新規作成
 * 2025/04/11 n.yasunari v1.0.1
 */
package com.example.teamdev.form;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @author n.yasunari
 * HomeForm
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HomeForm {
	/**
	 * 	打刻時間
	 */
	@NotBlank
	private String stampTime;
	/**
	 * 打刻種別
	 */
	@NotBlank
	private String stampType;
	/**
	 * 夜勤フラグ
	 */
	@NotBlank
	private String nightWorkFlag;
}
