package com.example.teamdev.util;

import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ui.Model;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.Map;

public class SessionUtil {

    private static final Logger logger = LoggerFactory.getLogger(SessionUtil.class);

    /**
     * セッションチェック処理
     *
     * @param session            HttpSession
     * @param redirectAttributes RedirectAttributes
     * @return セッションが無効な場合は "redirect:/signin" を返却、正常なら null
     */
    public static String checkSession(HttpSession session,
            RedirectAttributes redirectAttributes) {
        Map<String, Object> employeeMap = (Map<String, Object>) session.getAttribute(
                "employeeMap");
        if (employeeMap == null) {
            logger.warn("Session timeout or employeeMap not found in session.");
            redirectAttributes.addFlashAttribute("result",
                    "タイムアウトしました。再度ログインしてください。");
            return "redirect:/signin";
        }
        return null;
    }

    /**
     * セッションからログイン中の従業員IDを取得します。
     *
     * @param session            HTTPセッション
     * @param model              モデルオブジェクト (エラーメッセージ設定用)
     * @param redirectAttributes リダイレクト属性 (エラーメッセージ設定用)
     * @return ログイン中の従業員ID、またはエラーが発生した場合は null
     */
    public static Integer getLoggedInEmployeeId(HttpSession session, Model model,
            RedirectAttributes redirectAttributes) {
        @SuppressWarnings("unchecked")
        Map<String, Object> loggedInEmployeeMap = (Map<String, Object>) session.getAttribute(
                "employeeMap");
        if (loggedInEmployeeMap == null) {
            logger.error("セッションから従業員情報(employeeMap)を取得できませんでした。");
            model.addAttribute("registResult",
                    "セッションエラーが発生しました。再度ログインしてください。");
            return null;
        }
        try {
            return Integer.parseInt(loggedInEmployeeMap.get("id").toString());
        } catch (NumberFormatException e) {
            logger.error("セッション内の従業員IDの形式が無効です: {}",
                    loggedInEmployeeMap.get("id"), e);
            model.addAttribute("registResult",
                    "セッション内の従業員IDの形式が不正です。再度ログインしてください。");
            return null;
        }
    }
}
