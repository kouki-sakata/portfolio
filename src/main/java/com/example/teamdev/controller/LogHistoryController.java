package com.example.teamdev.controller;

import java.time.LocalDate;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.teamdev.form.StampHistoryForm;
import com.example.teamdev.service.LogHistoryService02;
import com.example.teamdev.service.StampHistoryService01;
import com.example.teamdev.util.ModelUtil;
import com.example.teamdev.util.SessionUtil;

/**
 * LogHistoryコントローラ
 */
@Controller
@RequestMapping("loghistory")
public class LogHistoryController {

	@Autowired
	StampHistoryService01 service01;
	@Autowired
	LogHistoryService02 service02;
	
	/**
	 * メニューからアクセスする
	 */
	@PostMapping("init")
	public String init(
			Model model,
			HttpSession session,
			RedirectAttributes redirectAttributes) {
		
		// セッションタイムアウト時ログイン画面にリダイレクトメソッド呼び出し
		String redirect = SessionUtil.checkSession(session,
				redirectAttributes);
		if (redirect != null)
			return redirect;
		
		// 初期表示：システム日付の属する年YYYY、月MM（ゼロ埋め）
        LocalDate currentDate = LocalDate.now();
        String year = String.valueOf(currentDate.getYear());
        String month = String.format("%02d", currentDate.getMonthValue());
		return view(year, month, model, session, redirectAttributes);
	}
	/**
	 * 検索を行う
	 */
	@PostMapping("search")
	public String search(
		@Validated StampHistoryForm stampHistoryForm,
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
			// 検索後の表示：ユーザーが設定した年YYYY、月MM
			return view(stampHistoryForm.getYear(), stampHistoryForm.getMonth(),
					model, session, redirectAttributes);
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
	 * 履歴確認画面表示
	 * @return log-history.html
	 */
	public String view(
			String year,
			String month,
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
			
			//履歴記録
			List<Map<String,Object>> logHistoryList = new ArrayList<Map<String,Object>>();
			logHistoryList = service02.execute(year , month);
			
			//年リスト取得
			List<String> yearList = service02.getYearList();
			//月リスト取得
			List<String> monthList = service01.getMonthList();
			
			//履歴記録
			model.addAttribute("selectYear", year);
			model.addAttribute("selectMonth", month);
			model.addAttribute("yearList", yearList);
			model.addAttribute("monthList", monthList);
			model.addAttribute("logHistoryList", logHistoryList);
			return "./loghistory/log-history";
		} catch (Exception e) {
			// エラー内容を出力
			System.out.println("例外発生" + e);
			//エラー画面表示
			return "error";
		}
	}
}
