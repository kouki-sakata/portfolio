/**
 * 2024/03/14 a.kuma 新規作成
 * 2025/04/09 n.yasunari v1.0.1
 */
package com.example.teamdev.controller;

import jakarta.servlet.http.HttpSession;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
/**
 * @author n.yasunari
 * SignInコントローラ
 */
@Controller 
@RequestMapping("signin")
public class SignInController {
	
	/**
	 * getでの初期表示
	 */
	@GetMapping
	public String getInit(
			Model model,
			@ModelAttribute("result") String result) {
		//リダイレクト（サインイン失敗時）の場合、resultに失敗メッセージ格納
		model.addAttribute("result", result);
		return view(model);
	}
	
	/**
	 * メニュー・サインアウトボタンからアクセスする
	 */
	//セッション破棄を行う為、HttpSessionオブジェクト、session.invalidate()メソッドを追記。5/8東島
	@PostMapping("init")
	public String postInit(
	        Model model,
	        RedirectAttributes redirectAttributes,
	        HttpSession session) {
	    // セッションの無効化
	    session.invalidate();
	    // サインアウトメッセージをリダイレクト先に渡す
	    redirectAttributes.addFlashAttribute("result", "サインアウトしました");
	    // サインイン画面へリダイレクト
	    return "redirect:/signin";
	}

	/**
	 * サインイン画面表示
	 * @return signin.html
	 */
	public String view(
			Model model) {
		model.addAttribute("msg", "Welcome back");
		return "./signin/signin";
	}
	
}