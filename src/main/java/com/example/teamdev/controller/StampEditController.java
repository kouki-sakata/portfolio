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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.thymeleaf.util.StringUtils;

import com.example.teamdev.form.StampEditForm;
import com.example.teamdev.service.EmployeeListService01;
import com.example.teamdev.service.StampEditService01;
import com.example.teamdev.service.StampHistoryService01;
import com.example.teamdev.util.ModelUtil;
import com.example.teamdev.util.SessionUtil;

/**
 * StampEditコントローラ
 */
@Controller
@RequestMapping("stampedit")
public class StampEditController {

	@Autowired
	EmployeeListService01 service01;
	@Autowired
	StampHistoryService01 service02;
	@Autowired
	StampEditService01 service03;


	/**
	 * メニューからアクセスする
	 */
	@PostMapping("init")
	public String init(
			Model model,
			HttpSession session,
			RedirectAttributes redirectAttributes) {
		return view("init", "", "", 0, model, session, redirectAttributes);
	}
	/**
	 * 対象従業員の打刻記録検索
	 */
	@PostMapping("search")
	public String search(
		@Validated StampEditForm stampEditForm,
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
                // カンマ区切り対策
                String employeeIdStr = stampEditForm.getEmployeeId();
                if (employeeIdStr.contains(",")) {
                    employeeIdStr = employeeIdStr.split(",")[0];
                }
                int employeeId = Integer.parseInt(employeeIdStr);
				String year = stampEditForm.getYear();
				String month = stampEditForm.getMonth();
				if(StringUtils.isEmpty(year)) {
					// 従業員選択画面からの表示：システム日付の属する年YYYY、月MM（ゼロ埋め）
					LocalDate currentDate = LocalDate.now();
					year = String.valueOf(currentDate.getYear());
					month = String.format("%02d", currentDate.getMonthValue());
				}
				return view("search", year, month, employeeId, model, session, redirectAttributes);
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
	 * 打刻記録編集を登録
	 */
	@PostMapping("regist")
	public String regist(
		@Validated StampEditForm stampEditForm,
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
		// カンマ区切り対策と"変更箇所がありません。"追記
		if (!bindingResult.hasErrors()) {
			try {
				//セッションに格納したサインイン従業員情報を取り出す
				Map<String, Object> employeeMap = (Map<String, Object>) session.getAttribute("employeeMap");
				//更新者IDとして使用
				int updateEmployeeId = Integer.parseInt(employeeMap.get("id").toString());
                // カンマ区切り対策
                String employeeIdStr = stampEditForm.getEmployeeId();
                if (employeeIdStr.contains(",")) {
                    employeeIdStr = employeeIdStr.split(",")[0];
                }
                int employeeId = Integer.parseInt(employeeIdStr);
                String year = stampEditForm.getYear();
                String month = stampEditForm.getMonth();
	            // 変更があるかチェック
	            if (!isStampChanged(stampEditForm, service02, year, month, employeeId)) {
	                model.addAttribute("result", "変更箇所がありません。");
	                // ここでview("search", ...)を呼ぶことで同じ画面を再表示
	            return view("search", year, month, employeeId, model, session, redirectAttributes);
	            }

	            // 打刻記録登録処理
	            service03.execute(stampEditForm.getStampEdit(), updateEmployeeId);
	            // 登録後のメッセージ表示をmodelからフラッシュメッセージに変更（山本 2025/5/8）
	            redirectAttributes.addFlashAttribute("result", "登録しました。");

	         // 登録完了後にGETメソッドへリダイレクト（山本 2025/5/8）
	            return "redirect:/stampedit/view?year=" + year + "&month=" + month + "&employeeId=" + employeeId;

	        } catch (Exception e) {
	            System.out.println("例外発生" + e);
	            return "error";
	        }
	    } else {
	        System.out.println("Validation errors:");
	        for (FieldError error : bindingResult.getFieldErrors()) {
	            System.out.println("Field: " + error.getField() + ", Error: " + error.getDefaultMessage());
	        }
	        return "error";
	    }
	}
	/**
	 * 打刻記録編集画面表示
	 * @return 【画面1】select-employee.html/【画面2】stamp-edit.html
	 */
	public String view(
			String type,
			String year,
			String month,
			int employeeId,
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

			if(type.equals("init")) {
				//初期表示：従業員選択【画面１】
				//一般
				List<Map<String,Object>>employeeList = new ArrayList<Map<String,Object>>();
				employeeList = service01.execute(0);
				//管理者
				List<Map<String,Object>> adminList = new ArrayList<Map<String,Object>>();
				adminList = service01.execute(1);
				//画面情報をmodelに格納
				//従業員情報
				model.addAttribute("employeeList", employeeList);
				model.addAttribute("adminList", adminList);

				return "./stampedit/select-employee";
			}else{
				//対象従業員の打刻記録編集【画面２】
				//対象年月・対象従業員IDで絞り込んで打刻記録を取得する
				List<Map<String,Object>>stampHistoryList = new ArrayList<Map<String,Object>>();
				stampHistoryList = service02.execute(year, month, employeeId);
				//年リスト取得
				List<String> yearList = service02.getYearList();
				//月リスト取得
				List<String> monthList = service02.getMonthList();
				//画面情報をmodelに格納
				//打刻記録編集
				model.addAttribute("stampHistoryList", stampHistoryList);
				model.addAttribute("selectYear", year);
				model.addAttribute("selectMonth", month);
				model.addAttribute("yearList", yearList);
				model.addAttribute("monthList", monthList);

				return "./stampedit/stamp-edit";
			}
		} catch (Exception e) {
			// エラー内容を出力
			System.out.println("例外発生" + e);
			//エラー画面表示
			return "error";
		}
	}
    /**
     * ※追記 入力内容が変更されているかチェックするメソッド
     */
    private boolean isStampChanged(StampEditForm form, StampHistoryService01 service02, String year, String month, int employeeId) {
        // DBから現在の打刻データを取得
        List<Map<String, Object>> currentList = service02.execute(year, month, employeeId);
        List<Map<String, Object>> newList = form.getStampEdit();
        if (currentList == null || newList == null) return false;
        if (currentList.size() != newList.size()) return true;
        // 日付ごとに出勤・退勤時刻が1つでも違えばtrue
        for (int i = 0; i < currentList.size(); i++) {
            Map<String, Object> curr = currentList.get(i);
            Map<String, Object> next = newList.get(i);
            String currIn = curr.get("in_time") != null ? curr.get("in_time").toString() : "";
            String nextIn = next.get("inTime") != null ? next.get("inTime").toString() : "";
            String currOut = curr.get("out_time") != null ? curr.get("out_time").toString() : "";
            String nextOut = next.get("outTime") != null ? next.get("outTime").toString() : "";
            if (!currIn.equals(nextIn) || !currOut.equals(nextOut)) {
                return true; // どこか1つでも違えば変更あり
            }
        }
        return false; // すべて同じなら変更なし
    }
    /**
     * 登録後リダイレクト用GETメソッド
     */
    @GetMapping("view")
    public String viewAfterRegistration(
        @RequestParam String year,
        @RequestParam String month,
        @RequestParam int employeeId,
        Model model,
        HttpSession session,
        RedirectAttributes redirectAttributes
    ) {
        // セッションタイムアウトチェック
        String redirect = SessionUtil.checkSession(session, redirectAttributes);
        if (redirect != null) return redirect;

        // 元の画面を表示
        return view("search", year, month, employeeId, model, session, redirectAttributes);
    }
}
