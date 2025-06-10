package com.example.teamdev.controller;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.teamdev.form.StampDeleteForm;
import com.example.teamdev.service.LogHistoryService01;
import com.example.teamdev.service.StampDeleteService;
import com.example.teamdev.service.StampHistoryService01;
import com.example.teamdev.util.ModelUtil;
import com.example.teamdev.util.SessionUtil;

@Controller
@RequestMapping("stampdelete")
public class StampDeleteController {

	@Autowired
	StampDeleteService stampDeleteService;
	@Autowired
	LogHistoryService01 logHistoryService;
	@Autowired
	StampHistoryService01 service01;

	/**
	 * メニューからアクセスする
	 */
	@PostMapping("init")
	public String init(
			@ModelAttribute StampDeleteForm stampDeleteForm,
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
		String month = String.format("%02d",
				currentDate.getMonthValue());
		return view(stampDeleteForm, year, month, model, session,
				redirectAttributes);
	}

	/**
	 * 打刻記録一括削除を行う
	 */
	@PostMapping("delete")
	public String delete(
			@ModelAttribute @Validated StampDeleteForm stampDeleteForm,
			BindingResult result,
			Model model,
			HttpSession session,
			RedirectAttributes redirectAttributes) {
		// セッションタイムアウト時ログイン画面にリダイレクトメソッド呼び出し
		String redirect = SessionUtil.checkSession(session,
				redirectAttributes);
		if (redirect != null)
			return redirect;

		//セッションに格納したサインイン従業員情報を取り出す
		// employeeMap.get("id")が必要なためそのまま記述
		Map<String, Object> employeeMap = (Map<String, Object>) session
				.getAttribute("employeeMap");
		//画面情報をmodelに格納
		model.addAttribute("employeeName",
				employeeMap.get("employeeName").toString());
		model.addAttribute("adminFlag",
				employeeMap.get("admin_flag").toString());

		// バリデーションエラーがある場合
		if (result.hasErrors()) {
			// 初期表示画面に戻る
			return "stampdelete/init";
		}

		// 日付の妥当性チェック（開始日が終了日より後でないか）
		if (!stampDeleteService.validateYearMonthRange(
				stampDeleteForm.getStartYear(),
				stampDeleteForm.getStartMonth(),
				stampDeleteForm.getEndYear(),
				stampDeleteForm.getEndMonth())) {
			result.rejectValue("startMonth", "error.date.range",
					"開始年月が終了年月より後の日付になっています");
			// 年リスト・月リスト再取得
			List<String> yearList = service01.getYearList();
			List<String> monthList = service01.getMonthList();

			// モデルに必要な属性を追加
			model.addAttribute("yearList", yearList);
			model.addAttribute("monthList", monthList);

			// 重要：選択されていた値をモデルに再設定
			model.addAttribute("selectYear",
					stampDeleteForm.getStartYear());
			model.addAttribute("selectMonth",
					stampDeleteForm.getStartMonth());

			// ナビゲーション設定
			ModelUtil.setNavigation(model, session);

			return "stampdelete/init";
		}

		// 削除処理を実行
		try {
			int deletedCount = stampDeleteService
					.deleteStampsByYearMonthRange(
							stampDeleteForm.getStartYear(),
							stampDeleteForm.getStartMonth(),
							stampDeleteForm.getEndYear(),
							stampDeleteForm.getEndMonth());
			// 履歴に登録
			Integer updateEmployeeId = Integer
					.parseInt(employeeMap.get("id").toString());
			logHistoryService.execute(5, 4, null, null,
					updateEmployeeId,
					Timestamp.valueOf(LocalDateTime.now()));

			// リダイレクト後の画面に削除件数を一時的に渡す（1回限り有効なFlash属性として保存）
			redirectAttributes.addFlashAttribute("deletedCount",
					deletedCount);

			return "redirect:/stampdelete/result";
		} catch (Exception e) {
			// エラー内容を出力
			System.out.println("例外発生" + e);
			//エラー画面表示
			return "error";
		}
	}

	/**
	 * 削除完了画面表示
	 * @return result.html
	 * PRGパターン（Post/Redirect/Get）を使用し、同じリクエストの再送信を防ぐ処理を追加
	 */
	@GetMapping("result")
	public String result(
			@ModelAttribute StampDeleteForm stampDeleteForm,
			Model model,
			HttpSession session,
			RedirectAttributes redirectAttributes) {

		// セッションタイムアウト時ログイン画面にリダイレクトメソッド呼び出し
		String redirect = SessionUtil.checkSession(session,
				redirectAttributes);
		if (redirect != null)
			return redirect;

		// ヘッダーとナビゲーション用の共通属性をModelに追加するメソッド呼び出し
		ModelUtil.setNavigation(model, session);

		// 初期表示用のフォームを設定
		if (!model.containsAttribute("stampDeleteForm")) {
			model.addAttribute("stampDeleteForm",
					new StampDeleteForm());
		}
		return "stampdelete/result";
	}

	/**
	 * 打刻記録一括削除画面表示
	 * @return init.html
	 */
	public String view(
			@ModelAttribute StampDeleteForm stampDeleteForm,
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
			// 年リスト取得
			List<String> yearList = service01.getYearList();
			// 月リスト取得
			List<String> monthList = service01.getMonthList();

			// フォームオブジェクトに初期値をセット
			stampDeleteForm.setStartYear(year);
			stampDeleteForm.setStartMonth(month);
			stampDeleteForm.setEndYear(year);
			stampDeleteForm.setEndMonth(month);

			// モデルに属性を追加
			model.addAttribute("yearList", yearList);
			model.addAttribute("monthList", monthList);

			// ヘッダーとナビゲーション用の共通属性をModelに追加
			ModelUtil.setNavigation(model, session);

			return "stampdelete/init";
		} catch (Exception e) {
			// エラー内容を出力
			System.out.println("例外発生" + e);
			//エラー画面表示
			return "error";
		}
	}

}
