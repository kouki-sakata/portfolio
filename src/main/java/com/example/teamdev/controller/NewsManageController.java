package com.example.teamdev.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.teamdev.form.ListForm;
import com.example.teamdev.form.NewsManageForm;
import com.example.teamdev.service.NewsManageService01;
import com.example.teamdev.service.NewsManageService02;
import com.example.teamdev.service.NewsManageService03;
import com.example.teamdev.service.NewsManageService04;
import com.example.teamdev.util.ModelUtil;
import com.example.teamdev.util.SessionUtil;

/**
 * NewsManageコントローラ
 */
@Controller
@RequestMapping("newsmanage")
public class NewsManageController {

	@Autowired
	NewsManageService01 service01;
	@Autowired
	NewsManageService02 service02;
	@Autowired
	NewsManageService03 service03;
	@Autowired
	NewsManageService04 service04;
	/**
	 * メニューからアクセスする
	 */
	@PostMapping("init")
	public String initPost(
			Model model,
			HttpSession session,
			RedirectAttributes redirectAttributes) {
		// セッションタイムアウト時ログイン画面にリダイレクトメソッド呼び出し
		String redirect = SessionUtil.checkSession(session,
				redirectAttributes);
		if (redirect != null)
			return redirect;
		
		return view(model, session, redirectAttributes);
	}
	/**
	 * 登録後リダイレクト用GETメソッド
	 */
	@GetMapping("init")
	public String initGet(
			Model model,
			HttpSession session,
			RedirectAttributes redirectAttributes) {
		// セッションタイムアウト時ログイン画面にリダイレクトメソッド呼び出し
		String redirect = SessionUtil.checkSession(session,
				redirectAttributes);
		if (redirect != null)
			return redirect;
		
		return view(model, session, redirectAttributes);
	}
	/**
	 * お知らせ情報を登録
	 */
	@PostMapping("regist")
	public String regist(
		@Validated NewsManageForm newsManageForm,
		BindingResult bindingResult,
		Model model,
		RedirectAttributes redirectAttributes,
		HttpSession session
	) {
		// セッションタイムアウト時ログイン画面にリダイレクトメソッド呼び出し
		String redirect = SessionUtil.checkSession(session,
				redirectAttributes);
		if (redirect != null)
			return redirect;
		
		// 必須チェック
		if (!bindingResult.hasErrors()) {
			try {
				//セッションに格納したサインイン従業員情報を取り出す
				Map<String, Object> employeeMap = (Map<String, Object>) session.getAttribute("employeeMap");
				//更新者IDとして使用
				Integer updateEmployeeId = Integer.parseInt(employeeMap.get("id").toString());
				//お知らせ情報を登録する
				service02.execute(newsManageForm, updateEmployeeId);
				
				// PRGパターン（Post/Redirect/Get）を使用し、同じリクエストの再送信を防ぐ処理を追加
				// Flash attribute に成功メッセージを追加
				redirectAttributes.addFlashAttribute("registResult", "登録しました");
				return "redirect:/newsmanage/init";

			} catch (Exception e) {
				// エラー内容を出力
				System.out.println("例外発生" + e);
				//エラー画面表示
				return "error";
			}
		} else {
			// エラー内容を取得して出力
			System.out.println("Validation errors:");
			for (FieldError error : bindingResult.getFieldErrors()) {
				System.out.println("Field: " + error.getField() + ", Error: " + error.getDefaultMessage());
			}
			//エラー画面表示
			return "error";
		}
	}
	/**
	 * お知らせ情報を公開/非公開
	 */
	@PostMapping("release")
	public String release(
		ListForm listForm,
		Model model,
		RedirectAttributes redirectAttributes,
		HttpSession session
	) {
		// セッションタイムアウト時ログイン画面にリダイレクトメソッド呼び出し
		String redirect = SessionUtil.checkSession(session,
				redirectAttributes);
		if (redirect != null)
			return redirect;
		
		try {
			//セッションに格納したサインイン従業員情報を取り出す
			Map<String, Object> employeeMap = (Map<String, Object>) session.getAttribute("employeeMap");
			//更新者IDとして使用
			Integer updateEmployeeId = Integer.parseInt(employeeMap.get("id").toString());
			service03.execute(listForm, updateEmployeeId);
			model.addAttribute("delRlsResult", "公開設定を更新しました。");
			return view(model, session, redirectAttributes);
		} catch (Exception e) {
			// エラー内容を出力
			System.out.println("例外発生" + e);
			//エラー画面表示
			return "error";
		}
	}
	/**
	 * お知らせ情報を削除
	 */
	@PostMapping("delete")
	public String delete(
		ListForm listForm,
		Model model,
		RedirectAttributes redirectAttributes,
		HttpSession session
	) {
		// セッションタイムアウト時ログイン画面にリダイレクトメソッド呼び出し
		String redirect = SessionUtil.checkSession(session,
				redirectAttributes);
		if (redirect != null)
			return redirect;
		
		try {
			//セッションに格納したサインイン従業員情報を取り出す
			Map<String, Object> employeeMap = (Map<String, Object>) session.getAttribute("employeeMap");
			//更新者IDとして使用
			Integer updateEmployeeId = Integer.parseInt(employeeMap.get("id").toString());
			service04.execute(listForm, updateEmployeeId);
			model.addAttribute("delRlsResult", "削除しました。");
			return view(model, session, redirectAttributes);
		} catch (Exception e) {
			// エラー内容を出力
			System.out.println("例外発生" + e);
			//エラー画面表示
			return "error";
		}
	}
	/**
	 * お知らせ管理画面表示
	 * @return news_manage.html
	 */
	public String view(
			Model model,
			HttpSession session,
			RedirectAttributes redirectAttributes) {
		// セッションタイムアウト時ログイン画面にリダイレクトメソッド呼び出し
		String redirect = SessionUtil.checkSession(session,
				redirectAttributes);
		if (redirect != null)
			return redirect;
		
		try {
			// ヘッダーとナビゲーション用の共通属性をModelに追加するメソッド呼び出し
			ModelUtil.setNavigation(model, session);
			
			//お知らせ情報を日付の降順で取得する
			List<Map<String,Object>> newsList = new ArrayList<Map<String,Object>>();
			newsList = service01.execute();
			
			//従業員情報
			model.addAttribute("newsList", newsList);
			
			return "./newsmanage/news-manage";
		} catch (Exception e) {
			// エラー内容を出力
			System.out.println("例外発生" + e);
			//エラー画面表示
			return "error";
		}
	}
}
