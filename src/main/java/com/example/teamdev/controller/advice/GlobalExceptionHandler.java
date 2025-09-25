package com.example.teamdev.controller.advice;

import com.example.teamdev.constant.AppConstants;
import com.example.teamdev.exception.BusinessException;
import com.example.teamdev.exception.DuplicateEmailException;
import com.example.teamdev.exception.EmployeeNotFoundException;
import com.example.teamdev.exception.ValidationException;
import com.example.teamdev.util.MessageUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 * アプリケーション全体で発生する例外をハンドルするコントローラアドバイスクラスです。
 * 特定のカスタム例外や汎用的な例外を捕捉し、適切なエラーレスポンス（エラーページへの遷移やリダイレクト）を返します。
 */
@Profile("legacy-ui")
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
        return determineRedirectForEmployeeException(request.getRequestURI());
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
        return determineRedirectForEmployeeException(request.getRequestURI());
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
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public String handleNumberFormatException(NumberFormatException ex, Model model, HttpServletRequest request) {
        logger.error("数値形式エラーが発生しました (URI: {}): {}", request.getRequestURI(), ex.getMessage(), ex);
        model.addAttribute("errorMessage", MessageUtil.getMessage("validation.number.format"));
        return "error";
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
    /**
     * ビジネス例外 {@link BusinessException} を処理します。
     * 400 Bad Requestステータスを返し、適切なエラーメッセージを表示します。
     *
     * @param ex 捕捉された BusinessException
     * @param redirectAttributes リダイレクト先にフラッシュメッセージを渡すための属性
     * @param request HTTPリクエスト情報 (ログ出力用)
     * @return 適切なリダイレクトパス
     */
    @ExceptionHandler(BusinessException.class)
    public String handleBusinessException(BusinessException ex, RedirectAttributes redirectAttributes, HttpServletRequest request) {
        logger.warn("ビジネス例外が発生しました (URI: {}): {}", request.getRequestURI(), ex.getMessage());
        
        String errorMessage;
        if (ex.getMessageKey() != null) {
            errorMessage = MessageUtil.getMessage(ex.getMessageKey(), ex.getMessageArgs());
        } else {
            errorMessage = ex.getMessage();
        }
        
        redirectAttributes.addFlashAttribute("globalError", errorMessage);
        return determineRedirectForBusinessException(request.getRequestURI());
    }

    /**
     * バリデーション例外 {@link ValidationException} を処理します。
     * 400 Bad Requestステータスを返し、フィールドエラー情報も含めて表示します。
     *
     * @param ex 捕捉された ValidationException
     * @param redirectAttributes リダイレクト先にフラッシュメッセージを渡すための属性
     * @param request HTTPリクエスト情報 (ログ出力用)
     * @return 適切なリダイレクトパス
     */
    @ExceptionHandler(ValidationException.class)
    public String handleValidationException(ValidationException ex, RedirectAttributes redirectAttributes, HttpServletRequest request) {
        logger.warn("バリデーション例外が発生しました (URI: {}): {}", request.getRequestURI(), ex.getMessage());
        
        redirectAttributes.addFlashAttribute("globalError", ex.getMessage());
        if (ex.getFieldErrors() != null) {
            redirectAttributes.addFlashAttribute("fieldErrors", ex.getFieldErrors());
        }
        
        return determineRedirectForBusinessException(request.getRequestURI());
    }

    /**
     * アクセス権限がない場合の {@link AccessDeniedException} を処理します。
     * 403 Forbiddenステータスを返し、適切なエラーメッセージを表示します。
     *
     * @param ex 捕捉された AccessDeniedException
     * @param model ビューに渡すデータを格納するモデル
     * @param request HTTPリクエスト情報 (ログ出力用)
     * @return アクセス拒否エラーページのビュー名
     */
    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public String handleAccessDeniedException(AccessDeniedException ex, Model model, HttpServletRequest request) {
        logger.warn("アクセス拒否エラーが発生しました (URI: {}): {}", request.getRequestURI(), ex.getMessage());
        model.addAttribute("errorMessage", MessageUtil.getMessage("auth.access.denied"));
        return "error";
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public String handleGenericException(Exception ex, Model model, HttpServletRequest request) {
        logger.error("予期せぬエラーが発生しました (URI: {}): {}", request.getRequestURI(), ex.getMessage(), ex);
        model.addAttribute("errorMessage", MessageUtil.getMessage("system.error"));
        return "error";
    }

    /**
     * 従業員関連例外のリダイレクト先を決定します
     * リクエストURIに基づいて適切なリダイレクト先を返します
     *
     * @param requestURI リクエストURI
     * @return リダイレクト先のパス
     */
    private String determineRedirectForEmployeeException(String requestURI) {
        if (requestURI.contains("/employeemanage")) {
            return AppConstants.Navigation.REDIRECT_EMPLOYEE_MANAGE_INIT;
        } else if (requestURI.contains("/home")) {
            return AppConstants.Navigation.REDIRECT_HOME_INIT;
        } else {
            // デフォルトは従業員管理画面
            return AppConstants.Navigation.REDIRECT_EMPLOYEE_MANAGE_INIT;
        }
    }

    /**
     * ビジネス例外のリダイレクト先を決定します
     * リクエストURIに基づいて適切なリダイレクト先を返します
     *
     * @param requestURI リクエストURI
     * @return リダイレクト先のパス
     */
    private String determineRedirectForBusinessException(String requestURI) {
        if (requestURI.contains("/employeemanage")) {
            return AppConstants.Navigation.REDIRECT_EMPLOYEE_MANAGE_INIT;
        } else if (requestURI.contains("/home")) {
            return AppConstants.Navigation.REDIRECT_HOME_INIT;
        } else if (requestURI.contains("/newsmanage")) {
            // ニュース管理画面があれば、そちらにリダイレクト
            return "redirect:/newsmanage/init";
        } else {
            // デフォルトはホーム画面
            return AppConstants.Navigation.REDIRECT_HOME_INIT;
        }
    }
}
