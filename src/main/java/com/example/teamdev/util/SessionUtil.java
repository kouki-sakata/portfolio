package com.example.teamdev.util;

import jakarta.servlet.http.HttpSession;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.Map;

public class SessionUtil {
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
            redirectAttributes.addFlashAttribute("result",
                    "タイムアウトしました。再度ログインしてください。");
            return "redirect:/signin";
        }
        return null;
    }
}
