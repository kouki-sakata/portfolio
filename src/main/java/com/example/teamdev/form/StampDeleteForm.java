package com.example.teamdev.form;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StampDeleteForm {

	@NotBlank(message = "開始年を選択してください")
	@Size(min = 4, max = 4)
	private String startYear;

	@NotBlank(message = "開始月を選択してください")
	@Size(min = 2, max = 2)
	private String startMonth;

	@NotBlank(message = "終了年を選択してください")
	@Size(min = 4, max = 4)
	private String endYear;

	@NotBlank(message = "終了月を選択してください")
	@Size(min = 2, max = 2)
	private String endMonth;

}
