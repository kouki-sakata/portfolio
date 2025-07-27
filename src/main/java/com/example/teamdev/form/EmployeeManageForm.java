package com.example.teamdev.form;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * EmployeeManageForm
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeManageForm {

	/**
	 * 新規作成時のバリデーショングループ
	 */
	public interface CreateGroup {}

	/**
	 * 更新時のバリデーショングループ
	 */
	public interface UpdateGroup {}

	/**
	 * 従業員ID
	 */
	private String employeeId;
	/**
	 * 姓
	 */
	@NotBlank
	private String firstName;
	/**
	 * 名
	 */
	@NotBlank
	private String lastName;
	/**
	 * メールアドレス
	 */
	@NotBlank
	@Email
	private String email;
	/**
	 * パスワード
	 */
	@Size(min=8,max=16, groups = {CreateGroup.class, UpdateGroup.class})
	@Pattern(regexp = "^[a-zA-Z0-9]+$", groups = {CreateGroup.class, UpdateGroup.class})
	@NotBlank(groups = CreateGroup.class)  // 新規作成時のみ必須
	private String password;
	/**
	 * 管理者フラグ
	 */
	@NotBlank
	private String adminFlag;
}
