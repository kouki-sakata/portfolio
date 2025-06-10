/**
 * 2024/04/11 n.yasunari 新規作成
 * 2025/04/11 n.yasunari v1.0.1
 */
package com.example.teamdev.form;

import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @author n.yasunari
 * StampEditForm
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StampEditForm {
	/**
	 * 従業員ID
	 */
	@NotBlank
	private String employeeId;
	/**
	 * 年
	 */
	private String year;
	/**
	 * 月
	 */
	private String month;
	/**
	 * 打刻記録変更情報
	 */
	private List<Map<String,Object>> stampEdit;
}