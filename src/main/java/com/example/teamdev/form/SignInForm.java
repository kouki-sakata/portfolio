package com.example.teamdev.form;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SignInForm
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignInForm {
	/**
	 * メールアドレス
	 */
	@NotBlank
	private String email;
	/**
	 * パスワード
	 */
	@NotBlank
	private String password;
}
