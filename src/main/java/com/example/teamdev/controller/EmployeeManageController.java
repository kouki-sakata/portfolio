package com.example.teamdev.controller;

import com.example.teamdev.form.EmployeeManageForm;
import com.example.teamdev.form.ListForm;
import com.example.teamdev.service.EmployeeListService01;
import com.example.teamdev.service.EmployeeManageService01;
import com.example.teamdev.service.EmployeeManageService02;
import com.example.teamdev.util.ModelUtil;
import com.example.teamdev.util.SessionUtil;
import jakarta.servlet.http.HttpSession;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * EmployeeManageコントローラ
 */
@Controller
@RequestMapping("employeemanage")
public class EmployeeManageController {

    @Autowired
    EmployeeListService01 service01;
    @Autowired
    EmployeeManageService01 service02;
    @Autowired
    EmployeeManageService02 service03;

    /**
     * メニューからアクセスする
     */
    @PostMapping("init")
    public String initPost(
            Model model,
            HttpSession session,
            RedirectAttributes redirectAttributes) {
        return view(model, session, redirectAttributes);
    }

    /**
     * 登録後リダイレクト用GETメソッド
     */
    @GetMapping("init")
    public String initGet(
            Model model,
            HttpSession session,
            RedirectAttributes redirectAttributes) {
        return view(model, session, redirectAttributes);
    }

    /**
     * 従業員情報の編集を登録
     */
    @PostMapping("regist")
    public String regist(
            @Validated EmployeeManageForm employeeManageForm,
            BindingResult bindingResult,
            Model model,
            RedirectAttributes redirectAttributes,
            HttpSession session
    ) {
        // セッションタイムアウト時ログイン画面にリダイレクトメソッド呼び出し
        String redirect = SessionUtil.checkSession(session,
                redirectAttributes);
        if (redirect != null)
            return redirect;

        // 必須チェック
        if (!bindingResult.hasErrors()) {
            try {
                //セッションに格納したサインイン従業員情報を取り出す
                Map<String, Object> employeeMap = (Map<String, Object>) session.getAttribute(
                        "employeeMap");
                //更新者IDとして使用
                Integer updateEmployeeId = Integer.parseInt(
                        employeeMap.get("id").toString());
                //メールアドレスの重複エラーの場合、falseが返却される
                boolean error = service02.execute(employeeManageForm,
                        updateEmployeeId);
                //従業員情報を登録
                service02.execute(employeeManageForm, updateEmployeeId);
                if (error) {
                    model.addAttribute("registResult",
                            "メールアドレスが重複しています。");
                } else {
                    // Flash attribute に成功メッセージを追加（2025/5/7 山本)
                    redirectAttributes.addFlashAttribute("registResult",
                            "登録しました");
                }
                // 登録完了後、リダイレクト先にGETリクエストを送り、再実行をしない
                return "redirect:/employeemanage/init";

            } catch (Exception e) {
                // エラー内容を出力
                System.out.println("例外発生" + e);
                //エラー画面表示
                return "error";
            }
        } else {
            // エラー内容を取得して出力
            System.out.println("Validation errors:");
            for (FieldError error : bindingResult.getFieldErrors()) {
                System.out.println(
                        "Field: " + error.getField() + ", Error: " + error.getDefaultMessage());
            }
            //エラー画面表示
            return "error";
        }
    }

    /**
     * 従業員情報を削除
     */
    @PostMapping("delete")
    public String delete(
            ListForm listForm,
            Model model,
            RedirectAttributes redirectAttributes,
            HttpSession session
    ) {
        // セッションタイムアウト時ログイン画面にリダイレクトメソッド呼び出し
        String redirect = SessionUtil.checkSession(session,
                redirectAttributes);
        if (redirect != null)
            return redirect;

        try {
            //セッションに格納したサインイン従業員情報を取り出す
            Map<String, Object> employeeMap = (Map<String, Object>) session.getAttribute(
                    "employeeMap");
            //更新者IDとして使用
            Integer updateEmployeeId = Integer.parseInt(
                    employeeMap.get("id").toString());
            //従業員情報削除処理
            service03.execute(listForm, updateEmployeeId);
            model.addAttribute("deleteResult", "削除しました。");
            return view(model, session, redirectAttributes);
        } catch (Exception e) {
            // エラー内容を出力
            System.out.println("例外発生" + e);
            //エラー画面表示
            return "error";
        }
    }

    /**
     * 画面表示
     *
     * @return employee-manage.html
     */
    public String view(
            Model model,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        // セッションタイムアウト時ログイン画面にリダイレクトメソッド呼び出し
        String redirect = SessionUtil.checkSession(session,
                redirectAttributes);
        if (redirect != null)
            return redirect;

        try {
            // ナビゲーション用の共通属性をModelに追加するメソッド呼び出し
            ModelUtil.setNavigation(model, session);

            //すべての従業員情報をID昇順で取得
            List<Map<String, Object>> employeeList = new ArrayList<Map<String, Object>>();
            employeeList = service01.execute(null);

            //従業員情報
            model.addAttribute("employeeList", employeeList);
            return "./employeemanage/employee-manage";
        } catch (Exception e) {
            // エラー内容を出力
            System.out.println("例外発生" + e);
            //エラー画面表示
            return "error";
        }
    }
}
