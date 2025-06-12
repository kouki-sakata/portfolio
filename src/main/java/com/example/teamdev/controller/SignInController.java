package com.example.teamdev.controller;

import jakarta.servlet.http.HttpSession; // Jakarta EE 9+

import org.slf4j.Logger; // SLF4J Logger を追加
import org.slf4j.LoggerFactory; // SLF4J LoggerFactory を追加
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.teamdev.form.SignInForm;

/**
 * サインイン画面（ログイン画面）に関連するリクエストを処理するコントローラです。
 * サインイン画面の表示、およびサインアウト処理（セッション無効化）を担当します。
 * 実際のサインイン認証処理は {@link HomeController#check(SignInForm, org.springframework.validation.BindingResult, Model, HttpSession, RedirectAttributes)} で行われます。
 */
@Controller
@RequestMapping("signin")
public class SignInController {

    private static final Logger logger = LoggerFactory.getLogger(SignInController.class); // Loggerを追加

    /**
     * サインイン画面を初期表示します。(GETリクエスト)
     * 既にセッションが存在し、有効な場合はホームページへリダイレクトするロジックはここにはありません。
     * Spring Security を導入した場合、認証済みユーザーの /signin へのアクセスは通常ホームページ等へリダイレクトされます。
     *
     * @param model モデルオブジェクト
     * @return サインイン画面のビュー名
     */
    @GetMapping("") // ルートパス ("signin") へのGETリクエストに対応
    public String getInit(Model model) {
        return view(model);
    }

    /**
     * サインアウト処理を行い、サインイン画面にリダイレクトします。(POSTリクエスト)
     * Spring Security を使用している場合、実際には Spring Security のログアウト処理が呼び出され、
     * ここでのセッション無効化は補助的または不要になる場合があります。
     * 現在は {@link com.example.teamdev.config.SecurityConfig SecurityConfig} で `/signin/init` がログアウトURLとして設定されています。
     *
     * @param session HTTPセッション (無効化するため)
     * @param redirectAttributes リダイレクト属性 (ログアウトメッセージの伝達に使用)
     * @return サインイン画面へのリダイレクトパス (ログアウトメッセージ付き)
     */
    @PostMapping("init") // Spring SecurityのlogoutUrlと一致させる
    public String postInit(HttpSession session, RedirectAttributes redirectAttributes) {
        // Spring Security が有効な場合、このメソッドが直接呼び出されるかどうかは設定による。
        // SecurityConfig で .logoutUrl("/signin/init") としている場合、
        // Spring Security がセッション無効化等を処理し、その後 .logoutSuccessUrl() へリダイレクトする。
        // ここでの session.invalidate() は、Spring Security の処理と重複する可能性があるため注意。
        // 通常は logoutSuccessUrl でメッセージを渡す方が一般的。
        if (session != null) {
            logger.info("サインアウト処理実行: セッションID {}", session.getId());
            session.invalidate(); // セッションを無効化
        }
        redirectAttributes.addFlashAttribute("message", "サインアウトしました。");
        return "redirect:/signin"; // サインイン画面へリダイレクト
    }

    /**
     * サインイン画面の表示に必要な情報をモデルに設定し、ビュー名を返します。
     *
     * @param model モデルオブジェクト
     * @return サインイン画面のビュー名 (./signin/signin)
     */
    public String view(Model model) {
        SignInForm signInForm = new SignInForm(); // 新しい SignInForm オブジェクトを生成
        model.addAttribute("form", signInForm); // "form" という名前で SignInForm をモデルに追加
        // TODO: 必要であれば、エラーメッセージやその他の情報をモデルに追加する
        return "./signin/signin";
    }
}
