package com.example.teamdev.controller;

import com.example.teamdev.entity.Employee; // Employee のインポートを確認・追加
import java.util.List;
// import java.util.Map; // Map が不要になったためコメントアウトまたは削除

import jakarta.servlet.http.HttpSession;

import org.slf4j.Logger; // SLF4J Logger を追加
import org.slf4j.LoggerFactory; // SLF4J LoggerFactory を追加
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.teamdev.service.EmployeeService;
import com.example.teamdev.util.ModelUtil;
import com.example.teamdev.util.SessionUtil;

/**
 * 従業員一覧表示に関連するリクエストを処理するコントローラです。
 */
@Controller
@RequestMapping("employeelist")
public class EmployeeListController {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeListController.class); // Loggerを追加

    private final EmployeeService employeeService; // 従業員関連のビジネスロジックを提供するサービス

    /**
     * EmployeeListControllerのコンストラクタ。
     * EmployeeServiceをインジェクションします。
     * @param employeeService 従業員サービス
     */
    @Autowired
    public EmployeeListController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    /**
     * 従業員一覧画面の初期表示を行います。(POSTリクエスト版)
     * 主にメニューからの遷移で使用されます。
     *
     * @param model モデルオブジェクト
     * @param session HTTPセッション
     * @param redirectAttributes リダイレクト属性
     * @return 従業員一覧画面のビュー名
     */
    @PostMapping("init")
    public String init(
            Model model,
            HttpSession session,
            RedirectAttributes redirectAttributes) {
        return view(model, session, redirectAttributes);
    }

    /**
     * 従業員一覧画面の表示に必要な情報を準備し、ビューを返します。
     * セッションチェック、ナビゲーション情報の設定、全従業員および管理者リストの取得を行います。
     *
     * @param model モデルオブジェクト
     * @param session HTTPセッション
     * @param redirectAttributes リダイレクト属性 (このメソッドでは直接使用されないが、他からの呼び出しフローを考慮)
     * @return 従業員一覧画面のビュー名 (./employeelist/employee-list) またはエラー画面のビュー名
     */
    public String view(
            Model model,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        String redirect = SessionUtil.checkSession(session, redirectAttributes);
        if (redirect != null) {
            return redirect; // セッションタイムアウト時
        }

        try {
            String navRedirect = ModelUtil.setNavigation(model, session, redirectAttributes);
            if (navRedirect != null) {
                return navRedirect; // ナビゲーション設定中にセッションタイムアウトが発生した場合
            }

            // 一般従業員 (adminFlag=0) と管理者 (adminFlag=1) のリストをそれぞれ取得
            List<com.example.teamdev.entity.Employee> employeeList = employeeService.getAllEmployees(0);
            List<com.example.teamdev.entity.Employee> adminList = employeeService.getAllEmployees(1);

            model.addAttribute("employeeList", employeeList);
            model.addAttribute("adminList", adminList);
            return "./employeelist/employee-list";
        } catch (Exception e) {
            logger.error("従業員一覧画面の表示中に例外が発生しました。", e);
            model.addAttribute("errorMessage", "従業員一覧の表示中にエラーが発生しました。"); // ユーザーフレンドリーなメッセージ
            return "error"; // 汎用エラーページ
        }
    }
}
