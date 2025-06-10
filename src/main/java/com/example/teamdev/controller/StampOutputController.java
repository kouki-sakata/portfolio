/**
 * 2024/03/14 n.yasunari 新規作成
 * 2025/04/11 n.yasunari v1.0.1
 */
package com.example.teamdev.controller;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpServletResponse;
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

import com.example.teamdev.form.StampOutputForm;
import com.example.teamdev.service.EmployeeListService01;
import com.example.teamdev.service.StampHistoryService01;
import com.example.teamdev.service.StampOutputService01;
import com.example.teamdev.util.ModelUtil;
import com.example.teamdev.util.SessionUtil;

/**
 * @author n.yasunari
 * StampOutputコントローラ
 */
@Controller
@RequestMapping("stampoutput")
public class StampOutputController {
	
	@Autowired
	EmployeeListService01 service01;
	@Autowired
	StampHistoryService01 service02;
	@Autowired
	StampOutputService01 service03;
	
	/**
	 * メニューからアクセスする
	 */
	@PostMapping("init")
	public String init(
			Model model,
			HttpSession session,
			RedirectAttributes redirectAttributes) {
		return view(model, session, redirectAttributes);
	}
	/**
	 * 打刻記録を出力
	 * void → return viewに変更（山本 2025/5/8）
	 */
	@PostMapping("output")
	public String output(
		HttpServletResponse response,
		@Validated StampOutputForm stampOutputForm,
		BindingResult bindingResult,
		Model model,
		RedirectAttributes redirectAttributes,
		HttpSession session
	) {
		//セッションに格納したサインイン従業員情報を取り出す（履歴記録のため山本追記 2025/5/9）
		Map<String, Object> employeeMap = (Map<String, Object>) session.getAttribute("employeeMap");
		//更新者IDとして使用
		Integer updateEmployeeId = Integer.parseInt(employeeMap.get("id").toString());
		
		// 必須チェック
		if (!bindingResult.hasErrors()) {
			try {
				//出力処理
				service03.execute(response, stampOutputForm, updateEmployeeId);
			} catch (Exception e) {
				// エラー内容を出力
				System.out.println("例外発生" + e);
			}
		} else {
			// エラー内容を取得して出力
			System.out.println("Validation errors:");
			for (FieldError error : bindingResult.getFieldErrors()) {
				System.out.println("Field: " + error.getField() + ", Error: " + error.getDefaultMessage());
			}
		}

		// modelにエラーメッセージ追加 （山本 2025/5/8）
		model.addAttribute("result", "出力する従業員情報を1件選択してください");
		return view(model, session, redirectAttributes);
	}
	/**
	 * 打刻記録編集画面表示
	 * @return stamp_output.html
	 */
	public String view(
			Model model,
			HttpSession session,
			RedirectAttributes redirectAttributes) {
			
			// セッションタイムアウト時ログイン画面にリダイレクトメソッド呼び出し（2024/4/24 山本追記）
			String redirect = SessionUtil.checkSession(session,
					redirectAttributes);
			if (redirect != null) 
				return redirect;
			
			// ヘッダーとナビゲーション用の共通属性をModelに追加するメソッド呼び出し（2025/5/2 山本変更)
			ModelUtil.setNavigation(model, session);
			
			try {
			//一般
			List<Map<String,Object>>employeeList = new ArrayList<Map<String,Object>>();
			employeeList = service01.execute(0);
			//管理者
			List<Map<String,Object>> adminList = new ArrayList<Map<String,Object>>();
			adminList = service01.execute(1);
			
			// 初期選択値：システム日付の属する年YYYY、月MM（ゼロ埋め）
			LocalDate currentDate = LocalDate.now();
			String year = String.valueOf(currentDate.getYear());
			String month = String.format("%02d", currentDate.getMonthValue());
			//年リスト取得
			List<String> yearList = service02.getYearList();
			//月リスト取得
			List<String> monthList = service02.getMonthList();
			
			//従業員情報
			model.addAttribute("employeeList", employeeList);
			model.addAttribute("adminList", adminList);
			//年・月
			model.addAttribute("selectYear", year);
			model.addAttribute("selectMonth", month);
			model.addAttribute("yearList", yearList);
			model.addAttribute("monthList", monthList);
			
			return "./stampoutput/stamp-output";
		} catch (Exception e) {
			// エラー内容を出力
			System.out.println("例外発生" + e);
			//エラー画面表示
			return "error";
		}
	}
}
