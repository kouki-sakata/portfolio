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
