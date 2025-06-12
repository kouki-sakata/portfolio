package com.example.teamdev.controller;

import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpSession;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

// Remove imports for old services if they are no longer used anywhere else in this class
// import com.example.teamdev.service.EmployeeListService01;
// import com.example.teamdev.service.EmployeeManageService02;
// Keep EmployeeManageService if it was the name before rename, now it's EmployeeService
import com.example.teamdev.service.EmployeeService; // Import the consolidated service

import com.example.teamdev.form.EmployeeManageForm;
import com.example.teamdev.form.ListForm;
import com.example.teamdev.util.ModelUtil;
import com.example.teamdev.util.SessionUtil;
// Exceptions are likely handled by GlobalExceptionHandler, but imports can remain if specific catches are still present
import com.example.teamdev.exception.DuplicateEmailException;
import com.example.teamdev.exception.EmployeeNotFoundException;

@Controller
@RequestMapping("employeemanage")
public class EmployeeManageController {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeManageController.class);

    private final EmployeeService employeeService; // Single consolidated service

    @Autowired
    public EmployeeManageController(EmployeeService employeeService) { // Updated constructor
        this.employeeService = employeeService;
    }

    @PostMapping("init")
    public String initPost(
            Model model,
            HttpSession session,
            RedirectAttributes redirectAttributes) {
        return view(model, session, redirectAttributes);
    }

    @GetMapping("init")
    public String initGet(
            Model model,
            HttpSession session,
            RedirectAttributes redirectAttributes) {
        return view(model, session, redirectAttributes);
    }

    @PostMapping("regist")
    public String regist(
            @Validated EmployeeManageForm employeeManageForm,
            BindingResult bindingResult,
            Model model,
            RedirectAttributes redirectAttributes,
            HttpSession session) {

        String sessionRedirect = SessionUtil.checkSession(session, redirectAttributes);
        if (sessionRedirect != null) {
            return sessionRedirect;
        }

        model.addAttribute("employeeManageForm", employeeManageForm);

        if (bindingResult.hasErrors()) {
            logger.warn("登録フォームに検証エラーがあります: {}", bindingResult.getAllErrors());
            model.addAttribute("bindingResult", bindingResult);
            return view(model, session, redirectAttributes);
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> loggedInEmployeeMap = (Map<String, Object>) session.getAttribute("employeeMap");
            if (loggedInEmployeeMap == null) {
                logger.error("セッションから従業員情報(employeeMap)を取得できませんでした。");
                model.addAttribute("registResult", "セッションエラーが発生しました。再度ログインしてください。");
                return view(model, session, redirectAttributes);
            }
            Integer updateEmployeeId = Integer.parseInt(loggedInEmployeeMap.get("id").toString());

            if (employeeManageForm.getEmployeeId() != null && !employeeManageForm.getEmployeeId().trim().isEmpty()) {
                Integer employeeId = Integer.parseInt(employeeManageForm.getEmployeeId());
                // Calls the method on the consolidated employeeService
                employeeService.updateEmployee(employeeId, employeeManageForm, updateEmployeeId);
                redirectAttributes.addFlashAttribute("registResult", "従業員情報を更新しました。");
            } else {
                // Calls the method on the consolidated employeeService
                employeeService.createEmployee(employeeManageForm, updateEmployeeId);
                redirectAttributes.addFlashAttribute("registResult", "従業員情報を登録しました。");
            }
            return "redirect:/employeemanage/init";

        } catch (NumberFormatException e) {
            logger.error("IDの形式が無効です: {}", e.getMessage());
            model.addAttribute("registResult", "IDの形式が無効です。");
            return view(model, session, redirectAttributes);
        }
        // DuplicateEmailException and EmployeeNotFoundException are handled by GlobalExceptionHandler
        // Other RuntimeExceptions will also be caught by GlobalExceptionHandler's generic handler
    }

    @PostMapping("delete")
    public String delete(
            ListForm listForm,
            Model model,
            RedirectAttributes redirectAttributes,
            HttpSession session) {

        String sessionRedirect = SessionUtil.checkSession(session, redirectAttributes);
        if (sessionRedirect != null) {
            return sessionRedirect;
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> employeeMap = (Map<String, Object>) session.getAttribute("employeeMap");
            if (employeeMap == null) {
                logger.error("セッションから従業員情報(employeeMap)を取得できませんでした。");
                redirectAttributes.addFlashAttribute("deleteResult", "セッションエラーが発生しました。再度ログインしてください。");
                return "redirect:/employeemanage/init";
            }
            Integer updateEmployeeId = Integer.parseInt(employeeMap.get("id").toString());

            // Calls the method on the consolidated employeeService
            employeeService.deleteEmployees(listForm, updateEmployeeId);
            redirectAttributes.addFlashAttribute("deleteResult", "選択された従業員情報を削除しました。");
            return "redirect:/employeemanage/init";
        } catch (Exception e) { // Catching general exceptions here for this specific flow
            logger.error("従業員の削除中にエラーが発生しました。", e);
            redirectAttributes.addFlashAttribute("deleteResult", "従業員の削除中にエラーが発生しました。");
            return "redirect:/employeemanage/init";
        }
    }

    public String view(
            Model model,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        try {
            ModelUtil.setNavigation(model, session);
            // Calls the method on the consolidated employeeService, passing null for adminFlag to get all employees
            List<Map<String, Object>> employeeList = employeeService.getAllEmployees(null);
            model.addAttribute("employeeList", employeeList);

            if (!model.containsAttribute("employeeManageForm")) {
                model.addAttribute("employeeManageForm", new EmployeeManageForm());
            }
            return "./employeemanage/employee-manage";
        } catch (Exception e) {
            logger.error("従業員管理画面の表示中にエラーが発生しました。", e);
            model.addAttribute("errorMessage", "画面表示中にエラーが発生しました。");
            return "error";
        }
    }
}
