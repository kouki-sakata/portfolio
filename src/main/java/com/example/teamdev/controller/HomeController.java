package com.example.teamdev.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap; // SignInFormからEmployeeへのマッピングで使用
import java.util.List;
import java.util.Map;

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
 * ホーム画面に関連するリクエストを処理するコントローラです。
 * 主にサインイン処理、打刻処理、ホーム画面の表示を担当します。
 */
@Controller
@RequestMapping("home")
public class HomeController {

    private static final Logger logger = LoggerFactory.getLogger(HomeController.class); // Loggerを追加

    private final HomeService01 homeService01; // お知らせ情報取得サービス
    private final HomeService02 homeService02; // 打刻登録サービス
    private final HomeService03 homeService03; // サインイン処理サービス
    // HttpSession は直接フィールドインジェクションするよりも、メソッド引数で受け取る方が一般的です。
    // しかし、既存のコードで @Autowired HttpSession httpSession; があったため、
    // コンストラクタインジェクションの対象からは外しますが、ベストプラクティスとしてはメソッド引数での使用を推奨します。
    // ここでは既存のフィールドとしてのHttpSessionは削除し、必要なメソッドで引数として受け取る形を想定します。
    // @Autowired // private final HttpSession httpSession; // ← 削除またはメソッド引数へ

    /**
     * HomeControllerのコンストラクタ。
     * 必要なサービスをインジェクションします。
     * @param homeService01 お知らせ情報取得サービス
     * @param homeService02 打刻登録サービス
     * @param homeService03 サインイン処理サービス
     */
    @Autowired
    public HomeController(
            HomeService01 homeService01,
            HomeService02 homeService02,
            HomeService03 homeService03) {
        this.homeService01 = homeService01;
        this.homeService02 = homeService02;
        this.homeService03 = homeService03;
        // this.httpSession = httpSession; // ← 削除
    }

    /**
     * ホーム画面の初期表示を行います。(POSTリクエスト版)
     * 主にメニューからの遷移で使用されます。
     *
     * @param model モデルオブジェクト
     * @param session HTTPセッション
     * @param redirectAttributes リダイレクト属性
     * @return ホーム画面のビュー名
     */
    @PostMapping("init")
    public String init(
            Model model,
            HttpSession session, // HttpSessionを引数で受け取る
            RedirectAttributes redirectAttributes) {
        return view(model, session, redirectAttributes);
    }

    /**
     * ホーム画面の初期表示を行います。(GETリクエスト版)
     * 主にリダイレクト時や直接アクセス時に使用されます。
     *
     * @param model モデルオブジェクト
     * @param session HTTPセッション
     * @param redirectAttributes リダイレクト属性
     * @return ホーム画面のビュー名
     */
    @GetMapping("init")
    public String initGet(
            Model model,
            HttpSession session, // HttpSessionを引数で受け取る
            RedirectAttributes redirectAttributes) {
        return view(model, session, redirectAttributes);
    }

    /**
     * サインイン処理を行います。
     * 入力されたサインイン情報（メールアドレス、パスワード）を検証し、
     * 成功すればホーム画面を表示し、失敗すればサインイン画面にリダイレクトします。
     *
     * @param signInForm サインインフォームオブジェクト (バリデーション済み)
     * @param bindingResult バリデーション結果
     * @param model モデルオブジェクト
     * @param session HTTPセッション (サインイン情報の格納に使用)
     * @param redirectAttributes リダイレクト属性 (エラーメッセージの伝達に使用)
     * @return 成功時はホーム画面のビュー名、失敗時はサインイン画面へのリダイレクトパス
     */
    @PostMapping("check")
    public String check(
            @Validated SignInForm signInForm, // パラメータ名をsignInFormに変更 (Javaの命名規則)
            BindingResult bindingResult,
            Model model,
            HttpSession session, // HttpSessionを引数で受け取る
            RedirectAttributes redirectAttributes) {

        if (!bindingResult.hasErrors()) {
            Employee employee = new Employee();
            employee.setEmail(signInForm.getEmail());
            employee.setPassword(signInForm.getPassword());

            // サインイン情報をチェックし、対象従業員情報を取得
            Map<String, Object> employeeMap = homeService03.execute(employee);

            // serviceクラスでサインイン成功（signInTimeキーが存在するかで判断）
            if (employeeMap.containsKey("signInTime")) {
                session.setAttribute("employeeMap", employeeMap); // サインイン従業員情報をセッションに格納
                return view(model, session, redirectAttributes); // ホーム画面表示
            } else {
                redirectAttributes.addFlashAttribute("result", "EmailまたはPasswordが一致しません");
                return "redirect:/signin"; // サインイン失敗
            }
        } else {
            // TODO: System.out.printlnではなく、SLF4J等のロガーを使用することを推奨
            logger.warn("サインインフォームの検証エラーが発生しました:");
            for (FieldError error : bindingResult.getFieldErrors()) {
                logger.warn("フィールド: {}, エラー: {}", error.getField(), error.getDefaultMessage());
            }
            redirectAttributes.addFlashAttribute("result", "EmailまたはPasswordが空白になっています");
            return "redirect:/signin";
        }
    }

    /**
     * 打刻情報を登録します。
     * フォームから受け取った打刻情報を基に、打刻処理サービスを呼び出します。
     *
     * @param homeForm ホーム画面フォームオブジェクト (バリデーション済み、打刻情報を含む)
     * @param bindingResult バリデーション結果
     * @param model モデルオブジェクト
     * @param redirectAttributes リダイレクト属性 (結果メッセージの伝達に使用)
     * @param session HTTPセッション (セッションチェック、従業員ID取得に使用)
     * @return 処理結果に応じてホーム画面へのリダイレクトパスまたはエラー画面のビュー名
     */
    @PostMapping("regist")
    public String regist(
            @Validated HomeForm homeForm,
            BindingResult bindingResult,
            Model model,
            RedirectAttributes redirectAttributes,
            HttpSession session // HttpSessionを引数で受け取る
    ) {
        String redirect = SessionUtil.checkSession(session, redirectAttributes);
        if (redirect != null) {
            return redirect; // セッションタイムアウト時
        }

        if (!bindingResult.hasErrors()) {
            try {
                @SuppressWarnings("unchecked") // セッション属性のキャストは型安全性が保証されないため抑制
                Map<String, Object> employeeMap = (Map<String, Object>) session.getAttribute("employeeMap");
                Integer employeeId = Integer.parseInt(employeeMap.get("id").toString());

                homeService02.execute(homeForm, employeeId); // 打刻登録処理

                LocalDateTime dateTime = LocalDateTime.parse(homeForm.getStampTime(), DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                String newDateTimeString = dateTime.format(DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss"));
                String type = homeForm.getStampType().equals("1") ? "出勤" : "退勤";

                redirectAttributes.addFlashAttribute("result", type + "時刻を登録しました。（" + newDateTimeString + "）");
                return "redirect:/home/init"; // 登録完了後リダイレクト
            } catch (Exception e) {
                // TODO: System.out.printlnではなく、SLF4J等のロガーを使用することを推奨
                logger.error("打刻登録中に例外が発生しました。", e);
                return "error"; // エラー画面表示
            }
        } else {
            // TODO: System.out.printlnではなく、SLF4J等のロガーを使用することを推奨
            logger.warn("打刻フォームの検証エラーが発生しました:");
            for (FieldError error : bindingResult.getFieldErrors()) {
                logger.warn("フィールド: {}, エラー: {}", error.getField(), error.getDefaultMessage());
            }
            return "error"; // エラー画面表示 (実際にはフォームに戻すべき)
        }
    }

    /**
     * ホーム画面の表示に必要な情報を準備し、ビューを返します。
     * セッションチェック、ナビゲーション情報の設定、お知らせ情報の取得を行います。
     *
     * @param model モデルオブジェクト
     * @param session HTTPセッション
     * @param redirectAttributes リダイレクト属性
     * @return ホーム画面のビュー名 (./home/home) またはエラー画面のビュー名
     */
    public String view(
            Model model,
            HttpSession session, // HttpSessionを引数で受け取る
            RedirectAttributes redirectAttributes) {

        String redirect = SessionUtil.checkSession(session, redirectAttributes);
        if (redirect != null) {
            return redirect; // セッションタイムアウト時
        }

        try {
            ModelUtil.setNavigation(model, session); // ヘッダー・ナビゲーション情報設定

            List<Map<String,Object>> newsList = homeService01.execute(); // お知らせ情報取得
            model.addAttribute("newsList", newsList);

            return "./home/home";
        } catch (Exception e) {
            // TODO: System.out.printlnではなく、SLF4J等のロガーを使用することを推奨
            logger.error("ホーム画面表示中に例外が発生しました。", e);
            return "error"; // エラー画面表示
        }
    }
}
