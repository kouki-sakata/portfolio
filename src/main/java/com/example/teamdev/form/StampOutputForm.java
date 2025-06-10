package com.example.teamdev.form;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * StampOutputForm
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StampOutputForm {

	/**
	 * 従業員IDリスト
	 */
	@NotEmpty(message = "従業員を選択してください")
	private List<String> employeeIdList;
	/**
	 * 年
	 */
	@NotBlank(message = "年を入力してください")
	private String year;
	/**
	 * 月
	 */
	@NotBlank(message = "月を入力してください")
	private String month;

}
