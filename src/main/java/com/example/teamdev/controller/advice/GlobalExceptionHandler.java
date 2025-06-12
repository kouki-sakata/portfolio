package com.example.teamdev.controller.advice;

import com.example.teamdev.exception.DuplicateEmailException;
import com.example.teamdev.exception.EmployeeNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 * アプリケーション全体で発生する例外をハンドルするコントローラアドバイスクラスです。
 * 特定のカスタム例外や汎用的な例外を捕捉し、適切なエラーレスポンス（エラーページへの遷移やリダイレクト）を返します。
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * メールアドレスの重複登録時にスローされる {@link DuplicateEmailException} を処理します。
     * エラーメッセージをリダイレクト属性に追加し、従業員管理画面へリダイレクトします。
     *
     * @param ex 捕捉された DuplicateEmailException
     * @param redirectAttributes リダイレクト先にフラッシュメッセージを渡すための属性
     * @param request HTTPリクエスト情報 (ログ出力用)
     * @return 従業員管理画面へのリダイレクトパス
     */
    @ExceptionHandler(DuplicateEmailException.class)
    public String handleDuplicateEmailException(DuplicateEmailException ex, RedirectAttributes redirectAttributes, HttpServletRequest request) {
        logger.warn("メールアドレス重複エラーが発生しました (URI: {}): {}", request.getRequestURI(), ex.getMessage());
        redirectAttributes.addFlashAttribute("globalError", ex.getMessage());
        // この例外は主に従業員登録・更新フォームで発生することを想定し、該当画面へリダイレクトする。
        // 他の箇所で発生しうる場合は、リダイレクト先をより汎用的にするか、ハンドラを分ける検討が必要。
        return "redirect:/employeemanage/init";
    }

    /**
     * 指定された従業員が見つからない場合にスローされる {@link EmployeeNotFoundException} を処理します。
     * エラーメッセージをリダイレクト属性に追加し、従業員管理画面へリダイレクトします。
     *
     * @param ex 捕捉された EmployeeNotFoundException
     * @param redirectAttributes リダイレクト先にフラッシュメッセージを渡すための属性
     * @param request HTTPリクエスト情報 (ログ出力用)
     * @return 従業員管理画面へのリダイレクトパス
     */
    @ExceptionHandler(EmployeeNotFoundException.class)
    public String handleEmployeeNotFoundException(EmployeeNotFoundException ex, RedirectAttributes redirectAttributes, HttpServletRequest request) {
        logger.warn("従業員未検出エラーが発生しました (URI: {}): {}", request.getRequestURI(), ex.getMessage());
        redirectAttributes.addFlashAttribute("globalError", ex.getMessage());
        // この例外も主に従業員管理系の操作で発生することを想定。
        return "redirect:/employeemanage/init";
    }

    /**
     * 文字列を数値に変換しようとして失敗した場合にスローされる {@link NumberFormatException} を処理します。
     * ユーザーフレンドリーなエラーメッセージをモデルに追加し、汎用エラーページを表示します。
     *
     * @param ex 捕捉された NumberFormatException
     * @param model ビューに渡すデータを格納するモデル
     * @param request HTTPリクエスト情報 (ログ出力用)
     * @return 汎用エラーページのビュー名
     */
    @ExceptionHandler(NumberFormatException.class)
    public String handleNumberFormatException(NumberFormatException ex, Model model, HttpServletRequest request) {
        logger.error("数値形式エラーが発生しました (URI: {}): {}", request.getRequestURI(), ex.getMessage(), ex); // スタックトレースも記録
        model.addAttribute("errorMessage", "入力された数値の形式が正しくありません。");
        model.addAttribute("details", "詳細: " + ex.getMessage()); // エラーの詳細をビューに渡す（開発時向け）
        return "error"; // templates/error.html などの汎用エラーページ
    }

    /**
     * 上記のハンドラで捕捉されなかった全ての {@link Exception} を処理する汎用ハンドラです。
     * システムエラーが発生したとみなし、ユーザーフレンドリーなメッセージと共に汎用エラーページを表示します。
     *
     * @param ex 捕捉された Exception
     * @param model ビューに渡すデータを格納するモデル
     * @param request HTTPリクエスト情報 (ログ出力用)
     * @return 汎用エラーページのビュー名
     */
    @ExceptionHandler(Exception.class)
    public String handleGenericException(Exception ex, Model model, HttpServletRequest request) {
        logger.error("予期せぬエラーが発生しました (URI: {}): {}", request.getRequestURI(), ex.getMessage(), ex); // スタックトレースも記録
        model.addAttribute("errorMessage", "予期せぬエラーが発生しました。システム管理者にお問い合わせください。");
        // 開発環境では詳細なエラー情報を表示することも検討 (本番ではセキュリティリスクになるため控える)
        // model.addAttribute("details", ex.getClass().getName() + ": " + ex.getMessage());
        return "error"; // templates/error.html などの汎用エラーページ
    }
}
