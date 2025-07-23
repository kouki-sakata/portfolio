package com.example.teamdev.util;

import com.example.teamdev.entity.Employee;
import org.springframework.ui.Model;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 * Spring Security対応のModel設定ユーティリティクラス
 */
public class SpringSecurityModelUtil {

    /**
     * Spring Securityベースでヘッダーとナビゲーション用の共通属性をModelに追加する
     * 
     * @param model Model
     * @param redirectAttributes RedirectAttributes
     * @return リダイレクトが必要な場合は該当パス、不要な場合はnull
     */
    public static String setNavigation(Model model, RedirectAttributes redirectAttributes) {
        Employee currentEmployee = SecurityUtil.getCurrentEmployee();
        
        if (currentEmployee == null) {
            redirectAttributes.addFlashAttribute("result", 
                MessageUtil.getMessage("auth.session.error"));
            return "redirect:/signin";
        }

        // 画面情報をmodelに格納（ヘッダーとナビゲーション）
        model.addAttribute("employeeName", 
            currentEmployee.getFirst_name() + "　" + currentEmployee.getLast_name());
        model.addAttribute("adminFlag", String.valueOf(currentEmployee.getAdmin_flag()));
        model.addAttribute("currentUser", currentEmployee);
        
        return null;
    }

    /**
     * Spring Securityベースで現在の従業員IDを取得
     * 
     * @param model Model
     * @param redirectAttributes RedirectAttributes  
     * @return 現在の従業員ID、取得できない場合はnull
     */
    public static Integer getCurrentEmployeeId(Model model, RedirectAttributes redirectAttributes) {
        Integer employeeId = SecurityUtil.getCurrentEmployeeId();
        
        if (employeeId == null) {
            model.addAttribute("registResult", 
                MessageUtil.getMessage("auth.session.error"));
            return null;
        }
        
        return employeeId;
    }
}