package com.example.teamdev.controller;

import com.example.teamdev.service.EmployeeListService01;
import com.example.teamdev.util.ModelUtil;
import com.example.teamdev.util.SessionUtil;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("employeelist")
public class EmployeeListController {

    @Autowired
    EmployeeListService01 service01;

    /**
     * メニューからアクセスする
     */
    @PostMapping("init")
    public String init(
            Model model,
            HttpSession session,
            RedirectAttributes redirectAttributes) {
        return view(model, session, redirectAttributes);
    }

    /**
     * 従業員情報画面表示
     *
     * @return employee-list.html
     */
    public String view(
            Model model,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        // セッションタイムアウト時ログイン画面にリダイレクトメソッド呼び出し
        String redirect = SessionUtil.checkSession(session, redirectAttributes);
        if (redirect != null)
            return redirect;

        try {
            // ヘッダーとナビゲーション用の共通属性をModelに追加するメソッド呼び出し
            ModelUtil.setNavigation(model, session);

            // 従業員情報を一般と管理者に分けて取得する
            // 一般
            List<Map<String, Object>> employeeList = new ArrayList<Map<String, Object>>();
            employeeList = service01.execute(0);
            // 管理者
            List<Map<String, Object>> adminList = new ArrayList<Map<String, Object>>();
            adminList = service01.execute(1);

            // 従業員情報
            model.addAttribute("employeeList", employeeList);
            model.addAttribute("adminList", adminList);
            return "./employeelist/employee-list";
        } catch (Exception e) {
            // エラー内容を出力
            System.out.println("例外発生" + e);
            //エラー画面表示
            return "error";
        }
    }
}
