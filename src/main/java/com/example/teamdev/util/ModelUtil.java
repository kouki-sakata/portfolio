package com.example.teamdev.util;

import jakarta.servlet.http.HttpSession;
import org.springframework.ui.Model;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.Map;

public class ModelUtil {
    /**
     * ヘッダーとナビゲーション用の共通属性をModelに追加する
     */
    @SuppressWarnings("unchecked")
    public static String setNavigation(
            Model model,
            HttpSession session,
            RedirectAttributes redirectAttributes
    ) {
        String redirect = SessionUtil.checkSession(session, redirectAttributes);
        if (redirect != null) {
            return redirect;
        }

        //セッションに格納したサインイン従業員情報を取り出す
        Map<String, Object> employeeMap = (Map<String, Object>) session
                .getAttribute("employeeMap");
        //画面情報をmodelに格納
        //ヘッダーとナビゲーション
        model.addAttribute("employeeName",
                employeeMap.get("employeeName").toString());
        model.addAttribute("adminFlag",
                employeeMap.get("admin_flag").toString());
        return null;
    }
}
