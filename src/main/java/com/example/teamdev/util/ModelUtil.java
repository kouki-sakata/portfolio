package com.example.teamdev.util;

import java.util.Map;

import jakarta.servlet.http.HttpSession;

import org.springframework.ui.Model;

public class ModelUtil {
	/**
	 * ヘッダーとナビゲーション用の共通属性をModelに追加する
	 * 2025/05/01 山本作成
	 */
	@SuppressWarnings("unchecked")
	public static void setNavigation(
			Model model,
			HttpSession session
			) {
		//セッションに格納したサインイン従業員情報を取り出す
		Map<String, Object> employeeMap = (Map<String, Object>) session
				.getAttribute("employeeMap");
		//画面情報をmodelに格納
		//ヘッダーとナビゲーション
		model.addAttribute("employeeName",
				employeeMap.get("employeeName").toString());
		model.addAttribute("adminFlag",
				employeeMap.get("admin_flag").toString());
	}
}
