package com.example.teamdev.controller;

import com.example.teamdev.form.StampOutputForm;
import com.example.teamdev.service.EmployeeService;
import com.example.teamdev.service.StampHistoryService;
import com.example.teamdev.service.StampOutputService;
import com.example.teamdev.util.ModelUtil;
import com.example.teamdev.util.SessionUtil;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 打刻履歴のCSV出力に関連するリクエストを処理するコントローラです。
 */
@Controller
@RequestMapping("stampoutput")
public class StampOutputController {

    private static final Logger logger = LoggerFactory.getLogger(
            StampOutputController.class); // Loggerを追加

    private final EmployeeService employeeService; // 従業員情報取得サービス
    private final StampHistoryService stampHistoryService; // 打刻履歴関連サービス (年月リスト取得用)
    private final StampOutputService stampOutputService;   // CSV出力処理サービス

    /**
     * StampOutputControllerのコンストラクタ。
     * 必要なサービスをインジェクションします。
     *
     * @param employeeService     従業員サービス
     * @param stampHistoryService 打刻履歴サービス
     * @param stampOutputService  CSV出力サービス
     */
    @Autowired
    public StampOutputController(
            EmployeeService employeeService,
            StampHistoryService stampHistoryService,
            StampOutputService stampOutputService) {
        this.employeeService = employeeService;
        this.stampHistoryService = stampHistoryService;
        this.stampOutputService = stampOutputService;
    }

    /**
     * 打刻履歴出力画面の初期表示を行います。(POSTリクエスト版)
     *
     * @param model              モデルオブジェクト
     * @param session            HTTPセッション
     * @param redirectAttributes リダイレクト属性
     * @return 打刻履歴出力画面のビュー名
     */
    @PostMapping("init")
    public String init(
            Model model,
            HttpSession session,
            RedirectAttributes redirectAttributes) {
        return view(model, session, redirectAttributes);
    }

    /**
     * 指定された条件に基づいて打刻履歴をCSVファイルとして出力します。
     *
     * @param response           HTTPレスポンス (CSV出力用)
     * @param stampOutputForm    出力条件（従業員ID、年月）を含むフォームオブジェクト (バリデーション済み)
     * @param bindingResult      バリデーション結果
     * @param model              モデルオブジェクト
     * @param redirectAttributes リダイレクト属性
     * @param session            HTTPセッション (操作者IDの取得、セッションチェックに使用)
     * @return CSV出力成功時はnull (レスポンス直接操作のため)、失敗時は打刻履歴出力画面のビュー名
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
        String sessionCheck = SessionUtil.checkSession(session,
                redirectAttributes);
        if (sessionCheck != null) {
            return sessionCheck; // セッションタイムアウト時
        }

        @SuppressWarnings("unchecked") // セッション属性からのキャストは型安全性がコンパイル時に保証されないため抑制
        Map<String, Object> employeeMap = (Map<String, Object>) session.getAttribute(
                "employeeMap");
        if (employeeMap == null) {
            logger.error(
                    "セッションから従業員情報(employeeMap)を取得できませんでした。");
            model.addAttribute("errorMessage",
                    "セッションエラーが発生しました。再度ログインしてください。");
            return view(model, session, redirectAttributes); // 初期画面に戻す
        }
        Integer updateEmployeeId = Integer.parseInt(
                employeeMap.get("id").toString());

        if (!bindingResult.hasErrors()) {
            try {
                stampOutputService.execute(response, stampOutputForm,
                        updateEmployeeId);
                // CSV出力が成功した場合、通常はレスポンスがコミットされるため、ここでは何も返さない (null)
                return null;
            } catch (Exception e) {
                logger.error("CSV出力中に予期せぬエラーが発生しました。", e);
                model.addAttribute("errorMessage",
                        "CSV出力処理中にエラーが発生しました。");
                // エラーが発生した場合は、再度画面を表示するための情報を設定
            }
        } else {
            logger.warn("CSV出力フォームの検証エラーが発生しました:");
            for (FieldError error : bindingResult.getFieldErrors()) {
                logger.warn("フィールド: {}, エラー: {}", error.getField(),
                        error.getDefaultMessage());
            }
            // バリデーションエラーメッセージはBindingResultを通じてビューに渡される想定
            // 必要であれば、model.addAttribute("bindingResult", bindingResult); のように明示的に追加
        }
        // エラー発生時またはバリデーションエラー時は、再度フォーム画面を表示
        model.addAttribute("result",
                "出力条件を確認してください。"); // 汎用的なメッセージ
        return view(model, session, redirectAttributes);
    }

    /**
     * 打刻履歴出力画面の表示に必要な情報を準備し、ビューを返します。
     *
     * @param model              モデルオブジェクト
     * @param session            HTTPセッション
     * @param redirectAttributes リダイレクト属性 (このメソッドでは直接使用されないが、他からの呼び出しフローを考慮)
     * @return 打刻履歴出力画面のビュー名 (./stampoutput/stamp-output) またはエラー画面のビュー名
     */
    public String view(
            Model model,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        String redirect = SessionUtil.checkSession(session, redirectAttributes);
        if (redirect != null) {
            return redirect; // セッションタイムアウト時
        }

        ModelUtil.setNavigation(model, session); // ヘッダー・ナビゲーション情報設定

        try {
            // 従業員リスト（一般・管理者）を取得
            List<com.example.teamdev.entity.Employee> employeeList = employeeService.getAllEmployees(
                    0);
            List<com.example.teamdev.entity.Employee> adminList = employeeService.getAllEmployees(
                    1);

            // 現在の年月と、選択可能な年月リストを取得
            LocalDate currentDate = LocalDate.now();
            String year = String.valueOf(currentDate.getYear());
            String month = String.format("%02d", currentDate.getMonthValue());
            List<String> yearList = stampHistoryService.getYearList();
            List<String> monthList = stampHistoryService.getMonthList();

            model.addAttribute("employeeList", employeeList);
            model.addAttribute("adminList", adminList);
            model.addAttribute("selectYear", year);
            model.addAttribute("selectMonth", month);
            model.addAttribute("yearList", yearList);
            model.addAttribute("monthList", monthList);

            // StampOutputFormがモデルにない場合（初期表示時など）に追加
            if (!model.containsAttribute("stampOutputForm")) {
                model.addAttribute("stampOutputForm", new StampOutputForm());
            }

            return "./stampoutput/stamp-output";
        } catch (Exception e) {
            logger.error(
                    "打刻履歴出力画面の表示中に予期せぬエラーが発生しました。",
                    e);
            model.addAttribute("errorMessage",
                    "画面表示中にエラーが発生しました。");
            return "error"; // 汎用エラーページ
        }
    }
}
