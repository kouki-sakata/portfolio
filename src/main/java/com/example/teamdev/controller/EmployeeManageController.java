package com.example.teamdev.controller;

import com.example.teamdev.dto.DataTablesRequest;
import com.example.teamdev.dto.DataTablesResponse;
import com.example.teamdev.exception.DuplicateEmailException;
import com.example.teamdev.form.EmployeeManageForm;
import com.example.teamdev.form.ListForm;
import org.springframework.validation.annotation.Validated;
import com.example.teamdev.service.EmployeeService;
import com.example.teamdev.util.SpringSecurityModelUtil;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 * 従業員情報の管理（登録、更新、削除、一覧表示）に関連するリクエストを処理するコントローラです。
 */
@Controller
@RequestMapping("employeemanage")
public class EmployeeManageController {

    private static final Logger logger = LoggerFactory.getLogger(
            EmployeeManageController.class);

    private final EmployeeService employeeService; // 従業員関連のビジネスロジックを提供するサービス

    /**
     * EmployeeManageControllerのコンストラクタ。
     * EmployeeServiceをインジェクションします。
     *
     * @param employeeService 従業員サービス
     */
    @Autowired
    public EmployeeManageController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @PostMapping("/data")
    @ResponseBody
    public DataTablesResponse getEmployeeData(@RequestBody DataTablesRequest request) {
        logger.info("DataTables request received: draw={}, start={}, length={}",
                request.getDraw(), request.getStart(), request.getLength());

        try {
            DataTablesResponse response = employeeService.getEmployeesForDataTables(
                    request);
            logger.info(
                    "DataTables response sent: recordsTotal={}, recordsFiltered={}, dataSize={}",
                    response.getRecordsTotal(), response.getRecordsFiltered(),
                    response.getData() != null ? response.getData().size() : 0);
            return response;
        } catch (Exception e) {
            logger.error("Error processing DataTables request", e);
            throw e;
        }
    }

    /**
     * 従業員管理画面の初期表示を行います。(POSTリクエスト版)
     * 主にメニューからの遷移で使用されます。
     *
     * @param model              モデルオブジェクト
     * @param session            HTTPセッション
     * @param redirectAttributes リダイレクト属性
     * @return 従業員管理画面のビュー名
     */
    @PostMapping("init")
    public String initPost(
            Model model,
            HttpSession session,
            RedirectAttributes redirectAttributes) {
        return view(model, session, redirectAttributes);
    }

    /**
     * 従業員管理画面の初期表示を行います。(GETリクエスト版)
     * 主にリダイレクト時や直接アクセス時に使用されます。
     *
     * @param model              モデルオブジェクト
     * @param session            HTTPセッション
     * @param redirectAttributes リダイレクト属性
     * @return 従業員管理画面のビュー名
     */
    @GetMapping("init")
    public String initGet(
            Model model,
            HttpSession session,
            RedirectAttributes redirectAttributes) {
        return view(model, session, redirectAttributes);
    }

    /**
     * 新規従業員の登録、または既存従業員の情報を更新します。
     * バリデーションエラーがある場合は、エラーメッセージと共にフォーム画面を再表示します。
     * 処理中に発生した例外 (DuplicateEmailException, EmployeeNotFoundException) は
     * {@link com.example.teamdev.controller.advice.GlobalExceptionHandler GlobalExceptionHandler} によって処理されます。
     *
     * @param employeeManageForm 登録または更新する従業員情報を含むフォームオブジェクト (バリデーション済み)
     * @param bindingResult      バリデーション結果
     * @param model              モデルオブジェクト
     * @param redirectAttributes リダイレクト属性 (処理結果メッセージの伝達に使用)
     * @param session            HTTPセッション (操作者IDの取得、セッションチェックに使用)
     * @return 成功時は従業員管理画面へのリダイレクトパス、バリデーションエラー時や処理失敗時は従業員管理画面のビュー名
     */
    @PostMapping("regist")
    public String regist(
            @Validated EmployeeManageForm employeeManageForm,
            BindingResult bindingResult,
            Model model,
            RedirectAttributes redirectAttributes,
            HttpSession session) {

        model.addAttribute("employeeManageForm",
                employeeManageForm); // エラー時にもフォームオブジェクトをビューに渡す

        if (bindingResult.hasErrors()) {
            logger.warn("登録フォームに検証エラーがあります: {}",
                    bindingResult.getAllErrors());
            model.addAttribute("bindingResult", bindingResult);
            return view(model, session,
                    redirectAttributes); // エラー詳細をビューに表示するため、viewメソッドを呼ぶ
        }

        Integer updateEmployeeId = SpringSecurityModelUtil.getCurrentEmployeeId(model,
                redirectAttributes);
        if (updateEmployeeId == null) {
            return view(model, session, redirectAttributes);
        }

        try {
            if (employeeManageForm.getEmployeeId() != null && !employeeManageForm.getEmployeeId().trim().isEmpty()) {
                // 更新の場合：パスワードは任意
                return updateEmployee(employeeManageForm, updateEmployeeId,
                        redirectAttributes, model, session);
            } else {
                // 新規作成の場合：パスワードは必須（フロントエンドで制御されるが、バックエンドでも検証）
                if (employeeManageForm.getPassword() == null || employeeManageForm.getPassword().trim().isEmpty()) {
                    model.addAttribute("globalError", "新規登録時はパスワードが必須です。");
                    return view(model, session, redirectAttributes);
                }
                return createEmployee(employeeManageForm, updateEmployeeId,
                        redirectAttributes, model, session);
            }
        } catch (NumberFormatException e) {
            logger.error("IDの形式が無効です: {}", e.getMessage());
            model.addAttribute("globalError", "IDの形式が無効です。");
            return view(model, session, redirectAttributes); // エラーメッセージをビューに表示
        }
    }


    private String createEmployee(EmployeeManageForm employeeManageForm,
            Integer updateEmployeeId, RedirectAttributes redirectAttributes, Model model,
            HttpSession session) {
        try {
            employeeService.createEmployee(employeeManageForm,
                    updateEmployeeId); // 新規従業員登録
            redirectAttributes.addFlashAttribute("registResult",
                    "従業員情報を登録しました。");
            return "redirect:/employeemanage/init";
        } catch (DuplicateEmailException e) {
            logger.warn("メールアドレス重複エラー: {}", e.getMessage());
            model.addAttribute("globalError", e.getMessage());
            model.addAttribute("employeeManageForm", employeeManageForm);
            return view(model, session, redirectAttributes);
        }
    }

    private String updateEmployee(EmployeeManageForm employeeManageForm,
            Integer updateEmployeeId, RedirectAttributes redirectAttributes, Model model,
            HttpSession session) {
        try {
            Integer employeeId = Integer.parseInt(employeeManageForm.getEmployeeId());
            employeeService.updateEmployee(employeeId, employeeManageForm,
                    updateEmployeeId); // 従業員情報更新
            redirectAttributes.addFlashAttribute("registResult",
                    "従業員情報を更新しました。");
            return "redirect:/employeemanage/init";
        } catch (com.example.teamdev.exception.DuplicateEmailException e) {
            logger.warn("メールアドレス重複エラー: {}", e.getMessage());
            model.addAttribute("globalError", e.getMessage());
            model.addAttribute("employeeManageForm", employeeManageForm);
            return view(model, session, redirectAttributes);
        } catch (com.example.teamdev.exception.EmployeeNotFoundException e) {
            logger.warn("従業員未検出エラー: {}", e.getMessage());
            model.addAttribute("globalError", e.getMessage());
            model.addAttribute("employeeManageForm", employeeManageForm);
            return view(model, session, redirectAttributes);
        }
    }

    /**
     * 指定された従業員情報を削除します。
     *
     * @param listForm           削除対象の従業員IDのリストを含むフォームオブジェクト
     * @param model              モデルオブジェクト (このメソッドでは直接使用されないが、他のフローとの一貫性のため残すことも検討)
     * @param redirectAttributes リダイレクト属性 (処理結果メッセージの伝達に使用)
     * @param session            HTTPセッション (操作者IDの取得、セッションチェックに使用)
     * @return 従業員管理画面へのリダイレクトパス
     */
    @PostMapping("delete")
    public String delete(
            ListForm listForm,
            Model model,
            RedirectAttributes redirectAttributes,
            HttpSession session) {

        Integer updateEmployeeId = SpringSecurityModelUtil.getCurrentEmployeeId(model,
                redirectAttributes);
        if (updateEmployeeId == null) {
            return "redirect:/employeemanage/init"; // エラーメッセージは getCurrentEmployeeId で設定済み
        }

        try {
            employeeService.deleteEmployees(listForm, updateEmployeeId); // 従業員削除処理
            redirectAttributes.addFlashAttribute("deleteResult",
                    "選択された従業員情報を削除しました。");
            return "redirect:/employeemanage/init";
        } catch (Exception e) {
            logger.error("従業員の削除中にエラーが発生しました。", e);
            redirectAttributes.addFlashAttribute("deleteResult",
                    "従業員の削除中にエラーが発生しました。");
            return "redirect:/employeemanage/init";
        }
    }

    /**
     * 従業員管理画面の表示に必要な情報を準備し、ビューを返します。
     * 全従業員のリストを取得し、モデルに追加します。
     *
     * @param model              モデルオブジェクト
     * @param session            HTTPセッション
     * @param redirectAttributes リダイレクト属性 (このメソッドでは直接使用されないが、他からの呼び出しフローを考慮)
     * @return 従業員管理画面のビュー名 (./employeemanage/employee-manage) またはエラー画面のビュー名
     */
    public String view(
            Model model,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        // セッションチェックは各エントリーポイント(initPost, initGetなど)で行われているため、
        // viewメソッドがそれらからのみ呼ばれる場合は重複する可能性がある。
        // SessionUtil.checkSessionの呼び出しはviewメソッドの責務か、呼び出し元の責務か検討の余地あり。
        // ここでは既存の構造を踏襲し、view内にもセッションチェックを残す。
        try {
            String navRedirect = SpringSecurityModelUtil.setNavigation(model,
                    redirectAttributes);
            if (navRedirect != null) {
                return navRedirect; // Spring Security認証でエラーが発生した場合
            }

            // フォームオブジェクトがモデルにない場合（例: GETリクエスト時）、空のフォームを追加
            if (!model.containsAttribute("employeeManageForm")) {
                model.addAttribute("employeeManageForm",
                        new EmployeeManageForm());
            }
            return "./employeemanage/employee-manage";
        } catch (Exception e) {
            logger.error("従業員管理画面の表示中にエラーが発生しました。", e);
            model.addAttribute("errorMessage",
                    "画面表示中にエラーが発生しました。");
            return "error"; // 汎用エラーページ
        }
    }
}
