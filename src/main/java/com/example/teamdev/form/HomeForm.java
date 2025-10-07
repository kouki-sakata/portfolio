package com.example.teamdev.form;

import com.example.teamdev.dto.api.home.StampType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
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
        @NotNull
        private StampType stampType;
	/**
	 * 夜勤フラグ
	 */
	@NotBlank
	private String nightWorkFlag;
}
