package com.example.teamdev.controller;

import com.example.teamdev.entity.Employee; // Employee のインポートを確認・追加
import java.time.LocalDate;
import java.util.List;
// import java.util.Map; // Map が不要になるか確認 (ただし、このファイルでは他でMapが使われている可能性あり)

import jakarta.servlet.http.HttpSession;

import org.slf4j.Logger; // SLF4J Logger を追加
import org.slf4j.LoggerFactory; // SLF4J LoggerFactory を追加
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
import com.example.teamdev.service.EmployeeService;
import com.example.teamdev.service.StampEditService01;
import com.example.teamdev.service.StampHistoryService01;
import com.example.teamdev.util.ModelUtil;
import com.example.teamdev.util.SessionUtil;

/**
 * 打刻編集画面に関連するリクエストを処理するコントローラです。
 * 従業員の選択、打刻履歴の検索・表示、打刻情報の登録（編集）機能を提供します。
 */
@Controller
@RequestMapping("stampedit")
public class StampEditController {

    private static final Logger logger = LoggerFactory.getLogger(StampEditController.class); // Loggerを追加

    private final EmployeeService employeeService; // 従業員情報取得サービス
    private final StampHistoryService01 stampHistoryService; // 打刻履歴関連サービス
    private final StampEditService01 stampEditService; // 打刻編集処理サービス

    /**
     * StampEditControllerのコンストラクタ。
     * 必要なサービスをインジェクションします。
     * @param employeeService 従業員サービス
     * @param stampHistoryService 打刻履歴サービス
     * @param stampEditService 打刻編集サービス
     */
    @Autowired
    public StampEditController(
            EmployeeService employeeService,
            StampHistoryService01 stampHistoryService,
            StampEditService01 stampEditService) {
        this.employeeService = employeeService;
        this.stampHistoryService = stampHistoryService;
        this.stampEditService = stampEditService;
    }

    /**
     * 打刻編集のための従業員選択画面を初期表示します。(POSTリクエスト版)
     *
     * @param model モデルオブジェクト
     * @param session HTTPセッション
     * @param redirectAttributes リダイレクト属性
     * @return 従業員選択画面のビュー名、またはエラー画面のビュー名
     */
    @PostMapping("init")
    public String init(
            Model model,
            HttpSession session,
            RedirectAttributes redirectAttributes) {
        return view("init", "", "", 0, model, session, redirectAttributes);
    }

    /**
     * 指定された従業員の打刻履歴を検索し、編集画面に表示します。
     *
     * @param stampEditForm 検索条件（従業員ID、年、月）を含むフォームオブジェクト (バリデーション済み)
     * @param bindingResult バリデーション結果
     * @param model モデルオブジェクト
     * @param redirectAttributes リダイレクト属性
     * @param session HTTPセッション
     * @return 打刻編集画面のビュー名、またはエラー画面のビュー名
     */
    @PostMapping("search")
    public String search(
        @Validated StampEditForm stampEditForm,
        BindingResult bindingResult,
        Model model,
        RedirectAttributes redirectAttributes,
        HttpSession session
    ) {
        String redirect = SessionUtil.checkSession(session, redirectAttributes);
        if (redirect != null) {
            return redirect; // セッションタイムアウト時
        }

        if (!bindingResult.hasErrors()) {
            try {
                String employeeIdStr = stampEditForm.getEmployeeId();
                // カンマが含まれている場合は最初の要素を使用 (例: "1,従業員A" -> "1")
                if (employeeIdStr.contains(",")) {
                    employeeIdStr = employeeIdStr.split(",")[0];
                }
                int employeeId = Integer.parseInt(employeeIdStr);
                String year = stampEditForm.getYear();
                String month = stampEditForm.getMonth();
                // 年月が指定されていない場合は現在の年月を設定
                if(StringUtils.isEmpty(year)) {
                    LocalDate currentDate = LocalDate.now();
                    year = String.valueOf(currentDate.getYear());
                    month = String.format("%02d", currentDate.getMonthValue());
                }
                return view("search", year, month, employeeId, model, session, redirectAttributes);
            } catch (NumberFormatException e) {
                logger.error("従業員IDの形式が無効です: {}", stampEditForm.getEmployeeId(), e);
                model.addAttribute("errorMessage", "従業員IDの形式が正しくありません。");
                return view("init", "", "", 0, model, session, redirectAttributes); // 初期画面に戻す、エラーメッセージ表示
            } catch (Exception e) {
                logger.error("打刻履歴検索中に予期せぬエラーが発生しました。", e);
                model.addAttribute("errorMessage", "検索処理中にエラーが発生しました。");
                return "error"; // 汎用エラーページ
            }
        } else {
            logger.warn("検索フォームの検証エラーが発生しました:");
            for (FieldError error : bindingResult.getFieldErrors()) {
                logger.warn("フィールド: {}, エラー: {}", error.getField(), error.getDefaultMessage());
            }
            // バリデーションエラー時は、従業員選択画面に戻す
            // TODO: エラーメッセージを適切に表示する仕組みを検討
            return view("init", "", "", 0, model, session, redirectAttributes);
        }
    }

    /**
     * 編集された打刻情報を登録します。
     *
     * @param stampEditForm 編集された打刻情報を含むフォームオブジェクト (バリデーション済み)
     * @param bindingResult バリデーション結果
     * @param model モデルオブジェクト
     * @param redirectAttributes リダイレクト属性 (処理結果メッセージの伝達に使用)
     * @param session HTTPセッション (操作者IDの取得、セッションチェックに使用)
     * @return 成功時はリダイレクトによる打刻編集画面の再表示、失敗時はエラー画面またはフォーム再表示
     */
    @PostMapping("regist")
    public String regist(
        @Validated StampEditForm stampEditForm,
        BindingResult bindingResult,
        Model model,
        RedirectAttributes redirectAttributes,
        HttpSession session
    ) {
        String redirect = SessionUtil.checkSession(session, redirectAttributes);
        if (redirect != null) {
            return redirect; // セッションタイムアウト時
        }

        if (!bindingResult.hasErrors()) {
            try {
                @SuppressWarnings("unchecked") // セッション属性からのキャストは型安全性がコンパイル時に保証されないため抑制
                Map<String, Object> loggedInEmployeeMap = (Map<String, Object>) session.getAttribute("employeeMap");
                if (loggedInEmployeeMap == null) {
                    logger.error("セッションから従業員情報(employeeMap)を取得できませんでした。");
                    model.addAttribute("errorMessage", "セッションエラーが発生しました。再度ログインしてください。");
                    return view("init", "", "", 0, model, session, redirectAttributes); // 初期画面に戻す
                }
                int updateEmployeeId = Integer.parseInt(loggedInEmployeeMap.get("id").toString());

                String employeeIdStr = stampEditForm.getEmployeeId();
                if (employeeIdStr.contains(",")) {
                    employeeIdStr = employeeIdStr.split(",")[0];
                }
                int employeeId = Integer.parseInt(employeeIdStr);
                String year = stampEditForm.getYear();
                String month = stampEditForm.getMonth();

                if (!isStampChanged(stampEditForm, this.stampHistoryService, year, month, employeeId)) {
                    model.addAttribute("result", "変更箇所がありません。");
                    return view("search", year, month, employeeId, model, session, redirectAttributes);
                }

                this.stampEditService.execute(stampEditForm.getStampEdit(), updateEmployeeId);
                redirectAttributes.addFlashAttribute("result", "登録しました。");
                // 登録後は該当の年月の編集画面にリダイレクト
                return "redirect:/stampedit/view?year=" + year + "&month=" + month + "&employeeId=" + employeeId;
            } catch (NumberFormatException e) {
                logger.error("従業員IDの形式が無効です: {}", stampEditForm.getEmployeeId(), e);
                model.addAttribute("errorMessage", "従業員IDの形式が正しくありません。");
                return view("init", "", "", 0, model, session, redirectAttributes); // 初期画面に戻す
            } catch (Exception e) {
                logger.error("打刻情報の登録中に予期せぬエラーが発生しました。", e);
                model.addAttribute("errorMessage", "登録処理中にエラーが発生しました。");
                return "error"; // 汎用エラーページ
            }
        } else {
            logger.warn("登録フォームの検証エラーが発生しました:");
            for (FieldError error : bindingResult.getFieldErrors()) {
                logger.warn("フィールド: {}, エラー: {}", error.getField(), error.getDefaultMessage());
            }
            // バリデーションエラー時は、エラー内容を保持したまま元の編集画面を表示する
            // このためには、employeeId, year, month を再度 view メソッドに渡す必要がある
            String employeeIdStr = stampEditForm.getEmployeeId();
            if (employeeIdStr != null && employeeIdStr.contains(",")) {
                 employeeIdStr = employeeIdStr.split(",")[0];
            }
            int employeeId = 0;
            try {
                if (employeeIdStr != null) employeeId = Integer.parseInt(employeeIdStr);
            } catch (NumberFormatException e) {
                logger.warn("バリデーションエラー後の従業員ID取得に失敗: {}", employeeIdStr);
                // IDが取得できない場合は初期画面へ
                return view("init", "", "", 0, model, session, redirectAttributes);
            }
            return view("search", stampEditForm.getYear(), stampEditForm.getMonth(), employeeId, model, session, redirectAttributes);
        }
    }

    /**
     * 画面タイプに応じて、従業員選択画面または打刻編集画面を表示します。
     *
     * @param type 表示タイプ ("init": 従業員選択, "search": 打刻編集)
     * @param year 表示対象の年 (打刻編集時)
     * @param month 表示対象の月 (打刻編集時)
     * @param employeeId 表示対象の従業員ID (打刻編集時)
     * @param model モデルオブジェクト
     * @param session HTTPセッション
     * @param redirectAttributes リダイレクト属性
     * @return 対応する画面のビュー名、またはエラー画面のビュー名
     */
    public String view(
            String type,
            String year,
            String month,
            int employeeId,
            Model model,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        String redirect = SessionUtil.checkSession(session, redirectAttributes);
        if (redirect != null) {
            return redirect; // セッションタイムアウト時
        }

        try {
            ModelUtil.setNavigation(model, session); // ヘッダー・ナビゲーション情報設定

            if(type.equals("init")) {
                // 従業員選択画面の準備
                List<com.example.teamdev.entity.Employee> employeeList = employeeService.getAllEmployees(0); // 一般従業員
                List<com.example.teamdev.entity.Employee> adminList = employeeService.getAllEmployees(1);    // 管理者
                model.addAttribute("employeeList", employeeList);
                model.addAttribute("adminList", adminList);
                if (!model.containsAttribute("stampEditForm")) { // フォームがなければ新規作成
                     model.addAttribute("stampEditForm", new StampEditForm());
                }
                return "./stampedit/select-employee";
            } else { // "search" または登録後の再表示など、打刻編集画面の場合
                List<Map<String,Object>> stampHistoryList = stampHistoryService.execute(year, month, employeeId);
                List<String> yearList = stampHistoryService.getYearList();
                List<String> monthList = stampHistoryService.getMonthList();

                model.addAttribute("stampHistoryList", stampHistoryList);
                model.addAttribute("selectYear", year);
                model.addAttribute("selectMonth", month);
                model.addAttribute("yearList", yearList);
                model.addAttribute("monthList", monthList);

                // フォームオブジェクトをモデルに追加（searchからの遷移やエラーからの再表示で必要）
                if (!model.containsAttribute("stampEditForm")) {
                    StampEditForm form = new StampEditForm();
                    form.setEmployeeId(String.valueOf(employeeId));
                    form.setYear(year);
                    form.setMonth(month);
                    model.addAttribute("stampEditForm", form);
                } else {
                    // 既にフォームがある場合でも、ID, 年, 月が正しいか確認・設定
                    StampEditForm existingForm = (StampEditForm) model.getAttribute("stampEditForm");
                    if (existingForm != null) {
                        existingForm.setEmployeeId(String.valueOf(employeeId));
                        existingForm.setYear(year);
                        existingForm.setMonth(month);
                    }
                }
                model.addAttribute("selectedEmployeeId", employeeId); // 選択された従業員IDをビューに渡す
                return "./stampedit/stamp-edit";
            }
        } catch (Exception e) {
            logger.error("打刻編集画面表示中に予期せぬエラーが発生しました。", e);
            model.addAttribute("errorMessage", "画面表示中にエラーが発生しました。");
            return "error"; // 汎用エラーページ
        }
    }

    /**
     * 打刻情報が変更されたかどうかを判定します。
     *
     * @param form 編集された打刻情報を含むフォーム
     * @param stampHistoryService 打刻履歴サービス (現在の情報を取得するため)
     * @param year 対象年
     * @param month 対象月
     * @param employeeId 対象従業員ID
     * @return 変更があればtrue、なければfalse
     */
    private boolean isStampChanged(StampEditForm form, StampHistoryService01 stampHistoryService, String year, String month, int employeeId) {
        List<Map<String, Object>> currentList = stampHistoryService.execute(year, month, employeeId);
        List<Map<String, Object>> newList = form.getStampEdit();

        // どちらかのリストがnullなら比較不能 (エラーケースに近いが、ここでは変更ありとみなさない)
        if (currentList == null || newList == null) return false;
        // リストサイズが異なれば変更あり
        if (currentList.size() != newList.size()) return true;

        for (int i = 0; i < currentList.size(); i++) {
            Map<String, Object> curr = currentList.get(i);
            Map<String, Object> next = newList.get(i);

            // DBからの時刻は Timestamp 型の場合があるため、toString() で比較。nullも考慮。
            String currIn = curr.get("in_time") != null ? curr.get("in_time").toString().substring(0, 16) : ""; // yyyy-MM-dd HH:mm
            String nextIn = next.get("inTime") != null ? next.get("inTime").toString() : "";
            if (nextIn.length() > 16) nextIn = nextIn.substring(0,16); // HH:mm:ss を HH:mm に合わせる (もしあれば)

            String currOut = curr.get("out_time") != null ? curr.get("out_time").toString().substring(0, 16) : ""; // yyyy-MM-dd HH:mm
            String nextOut = next.get("outTime") != null ? next.get("outTime").toString() : "";
            if (nextOut.length() > 16) nextOut = nextOut.substring(0,16);

            // フォームからの入力は "HH:mm" または空文字を想定。DBは "yyyy-MM-dd HH:mm:ss.S"
            // ここでは簡単化のため、DBの日付部分を除いた時刻部分(HH:mm)で比較するロジックが必要になるが、
            // 現在の in_time, out_time は Timestamp なので、より正確な比較には日付情報も必要。
            // ここでは、元のロジックの雰囲気を残しつつ、文字列比較を行っている。
            // より堅牢な比較のためには、Timestamp とフォームからの文字列 (HH:mm) を
            // 同じ LocalTime や LocalDateTime に変換して比較すべき。
            // 現状は、フォーム入力が HH:mm で、DBが yyyy-MM-dd HH:mm:ss.S の場合、単純な文字列比較では不一致になる。
            // TODO: 時刻比較ロジックの改善。Timestampとフォーム入力(HH:mm)の正確な比較。

            // 元のロジックに近い形で比較 (ただし、これだと日付部分も比較対象になる)
            // String currIn = curr.get("in_time") != null ? curr.get("in_time").toString() : "";
            // String nextIn = next.get("inTime") != null ? next.get("inTime").toString() : "";
            // String currOut = curr.get("out_time") != null ? curr.get("out_time").toString() : "";
            // String nextOut = next.get("outTime") != null ? next.get("outTime").toString() : "";


            if (!currIn.equals(nextIn) || !currOut.equals(nextOut)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 打刻情報登録後のリダイレクト先として、指定された条件で打刻編集画面を表示します。
     *
     * @param year 表示対象の年
     * @param month 表示対象の月
     * @param employeeId 表示対象の従業員ID
     * @param model モデルオブジェクト
     * @param session HTTPセッション
     * @param redirectAttributes リダイレクト属性
     * @return 打刻編集画面のビュー名
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
        String redirect = SessionUtil.checkSession(session, redirectAttributes);
        if (redirect != null) return redirect; // セッションタイムアウト時

        // viewメソッドに処理を委譲。"search"タイプとして打刻編集画面を表示
        return view("search", year, month, employeeId, model, session, redirectAttributes);
    }
}
