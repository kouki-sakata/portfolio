/**
 * 2024/03/14 n.yasunari 新規作成
 * 2025/04/09 n.yasunari v1.0.1
 */
package com.example.teamdev.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
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

import com.example.teamdev.entity.Employee;
import com.example.teamdev.form.HomeForm;
import com.example.teamdev.form.SignInForm;
import com.example.teamdev.service.HomeService01;
import com.example.teamdev.service.HomeService02;
import com.example.teamdev.service.HomeService03;
import com.example.teamdev.util.ModelUtil;
import com.example.teamdev.util.SessionUtil;

/**
 * @author n.yasunari
 * Homeコントローラ
 */
@Controller
@RequestMapping("home")
public class HomeController {

	@Autowired
	HomeService01 service01;
	@Autowired
	HomeService02 service02;
	@Autowired
	HomeService03 service03;
	@Autowired
    HttpSession httpSession;
	
	/**
	 * メニューからアクセスする
	 */
	@PostMapping("init")
	public String init(
			Model model,
			HttpSession session,
			RedirectAttributes redirectAttributes) {
		return view(model,session, redirectAttributes);
	}
	
	//home画面に遷移させる為、追記 4/30東島
	@GetMapping("init")
	public String initGet(
	    Model model,
	    HttpSession session,
	    RedirectAttributes redirectAttributes) {
	    return view(model, session, redirectAttributes);
	}
	
	/**
	 * サインイン画面→ホーム画面
	 * サインイン入力値と登録済み従業員情報の一致確認を行う
	 */
	@PostMapping("check")
	public String check(
		@Validated SignInForm SignInForm,
		BindingResult bindingResult,
		Model model,
		HttpSession session,
		RedirectAttributes redirectAttributes
	){
		
		// 必須チェック
		if (!bindingResult.hasErrors()) {
			Employee employee = new Employee();
			employee.setEmail(SignInForm.getEmail());
			employee.setPassword(SignInForm.getPassword());
			Map<String, Object> employeeMap = new HashMap<String, Object>();
			//サインイン情報をチェックして、対象従業員情報を格納する
			employeeMap = service03.execute(employee);
			//serviceクラスでサインイン成功（＝サインインに成功した時刻が格納されている）
			if(employeeMap.containsKey("signInTime")) {
				// サインイン従業員情報をsessionに詰める
				session.setAttribute("employeeMap", employeeMap);
				//ホーム画面表示
				return view(model,session, redirectAttributes);
			} else {
				//サインイン失敗の場合
				redirectAttributes.addFlashAttribute("result", "EmailまたはPasswordが一致しません");
				return "redirect:/signin";
			}
		} else {
			// エラー内容を取得して出力
			System.out.println("Validation errors:");
			for (FieldError error : bindingResult.getFieldErrors()) {
				System.out.println("Field: " + error.getField() + ", Error: " + error.getDefaultMessage());
			}
			redirectAttributes.addFlashAttribute("result",
					"EmailまたはPasswordが空白になっています");
			return "redirect:/signin";
		}
	}
	
	/**
	 * 打刻登録を行う
	 */
	@PostMapping("regist")
	public String regist(
		@Validated HomeForm homeForm,
		BindingResult bindingResult,
		Model model,
		RedirectAttributes redirectAttributes,
		HttpSession session
	) {
		// セッションタイムアウト時ログイン画面にリダイレクトメソッド呼び出し（2024/4/24 山本追記）
		String redirect = SessionUtil.checkSession(session,
				redirectAttributes);
		if (redirect != null) 
			return redirect;
				
		// 必須チェック
		if (!bindingResult.hasErrors()) {
			try {
				Map<String, Object> employeeMap = (Map<String, Object>) session.getAttribute("employeeMap");
				Integer employeeId = Integer.parseInt(employeeMap.get("id").toString());
				//打刻登録処理を行う
				service02.execute(homeForm, employeeId);
				//modelに登録完了メッセージを格納
				//「出勤or退勤 時刻を登録しました。（yyyy/MM/dd HH:mm:ss）」
				LocalDateTime dateTime = 
					LocalDateTime.parse(homeForm.getStampTime(), DateTimeFormatter.ISO_LOCAL_DATE_TIME);
				String newDateTimeString = dateTime.format(DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss"));
				String type = homeForm.getStampType().equals("1") ? "出勤" : "退勤";
				
				// Flash attribute に成功メッセージを追加（2025/5/8 山本)
				redirectAttributes.addFlashAttribute("result", type + "時刻を登録しました。（" + newDateTimeString + "）");
				
				// 登録完了後、リダイレクト先にGETリクエストを送り、再実行をしない（2025/5/8 山本)
				return "redirect:/home/init";
				
			} catch (Exception e) {
				System.out.println("例外発生" + e);
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
	 * ホーム画面表示
	 * @return home.html
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
		
		try {
			// ヘッダーとナビゲーション用の共通属性をModelに追加するメソッド呼び出し（2025/5/1 山本変更)
			ModelUtil.setNavigation(model, session);
			
			List<Map<String,Object>>newsList = new ArrayList<Map<String,Object>>();
			//画面情報取得処理
			newsList = service01.execute();
			
			//お知らせ情報
			model.addAttribute("newsList", newsList);
			return "./home/home";
		} catch (Exception e) {
			// エラー内容を出力
			System.out.println("例外発生" + e);
			//エラー画面表示
			return "error";
		}
		
	}
}
