package com.example.teamdev.controller;

import java.time.LocalDate;
import java.util.ArrayList; // Keep this if new ArrayList<>() is used
import java.util.List;
import java.util.Map;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.thymeleaf.util.StringUtils; // This import was present, keep it

import com.example.teamdev.form.StampEditForm;
// Import EmployeeService
import com.example.teamdev.service.EmployeeService;
// Remove: import com.example.teamdev.service.EmployeeListService01;
import com.example.teamdev.service.StampEditService01;
import com.example.teamdev.service.StampHistoryService01;
import com.example.teamdev.util.ModelUtil;
import com.example.teamdev.util.SessionUtil;

@Controller
@RequestMapping("stampedit")
public class StampEditController {

    // Change to constructor injection and use final
    private final EmployeeService employeeService;
    private final StampHistoryService01 stampHistoryService;
    private final StampEditService01 stampEditService;

    @Autowired
    public StampEditController(
            EmployeeService employeeService,
            StampHistoryService01 stampHistoryService,
            StampEditService01 stampEditService) {
        this.employeeService = employeeService;
        this.stampHistoryService = stampHistoryService;
        this.stampEditService = stampEditService;
    }

    @PostMapping("init")
    public String init(
            Model model,
            HttpSession session,
            RedirectAttributes redirectAttributes) {
        // Pass 0 for employeeId as it's not used in "init" type view logic for selecting employee
        return view("init", "", "", 0, model, session, redirectAttributes);
    }

    @PostMapping("search")
    public String search(
        @Validated StampEditForm stampEditForm,
        BindingResult bindingResult,
        Model model,
        RedirectAttributes redirectAttributes,
        HttpSession session
    ) {
        String redirect = SessionUtil.checkSession(session, redirectAttributes);
        if (redirect != null)
            return redirect;

        if (!bindingResult.hasErrors()) {
            try {
                String employeeIdStr = stampEditForm.getEmployeeId();
                if (employeeIdStr.contains(",")) {
                    employeeIdStr = employeeIdStr.split(",")[0];
                }
                int employeeId = Integer.parseInt(employeeIdStr);
                String year = stampEditForm.getYear();
                String month = stampEditForm.getMonth();
                if(StringUtils.isEmpty(year)) {
                    LocalDate currentDate = LocalDate.now();
                    year = String.valueOf(currentDate.getYear());
                    month = String.format("%02d", currentDate.getMonthValue());
                }
                return view("search", year, month, employeeId, model, session, redirectAttributes);
            } catch (Exception e) {
                System.out.println("例外発生" + e);
                return "error";
            }
        } else {
            System.out.println("Validation errors:");
            for (FieldError error : bindingResult.getFieldErrors()) {
                System.out.println("Field: " + error.getField() + ", Error: " + error.getDefaultMessage());
            }
            return "error";
        }
    }

    @PostMapping("regist")
    public String regist(
        @Validated StampEditForm stampEditForm,
        BindingResult bindingResult,
        Model model,
        RedirectAttributes redirectAttributes,
        HttpSession session
    ) {
        String redirect = SessionUtil.checkSession(session, redirectAttributes);
        if (redirect != null)
            return redirect;

        if (!bindingResult.hasErrors()) {
            try {
                Map<String, Object> employeeMap = (Map<String, Object>) session.getAttribute("employeeMap");
                int updateEmployeeId = Integer.parseInt(employeeMap.get("id").toString());
                String employeeIdStr = stampEditForm.getEmployeeId();
                if (employeeIdStr.contains(",")) {
                    employeeIdStr = employeeIdStr.split(",")[0];
                }
                int employeeId = Integer.parseInt(employeeIdStr);
                String year = stampEditForm.getYear();
                String month = stampEditForm.getMonth();
                // Use injected stampHistoryService
                if (!isStampChanged(stampEditForm, this.stampHistoryService, year, month, employeeId)) {
                    model.addAttribute("result", "変更箇所がありません。");
                    return view("search", year, month, employeeId, model, session, redirectAttributes);
                }
                // Use injected stampEditService
                this.stampEditService.execute(stampEditForm.getStampEdit(), updateEmployeeId);
                redirectAttributes.addFlashAttribute("result", "登録しました。");
                return "redirect:/stampedit/view?year=" + year + "&month=" + month + "&employeeId=" + employeeId;
            } catch (Exception e) {
                System.out.println("例外発生" + e);
                return "error";
            }
        } else {
            System.out.println("Validation errors:");
            for (FieldError error : bindingResult.getFieldErrors()) {
                System.out.println("Field: " + error.getField() + ", Error: " + error.getDefaultMessage());
            }
            return "error";
        }
    }

    public String view(
            String type,
            String year,
            String month,
            int employeeId,
            Model model,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        String redirect = SessionUtil.checkSession(session, redirectAttributes);
        if (redirect != null)
            return redirect;

        try {
            ModelUtil.setNavigation(model, session);

            if(type.equals("init")) {
                // Use the new service method
                List<Map<String,Object>> employeeList = employeeService.getAllEmployees(0);
                List<Map<String,Object>> adminList = employeeService.getAllEmployees(1);
                model.addAttribute("employeeList", employeeList);
                model.addAttribute("adminList", adminList);
                return "./stampedit/select-employee";
            } else { // Assuming "search" or other types that show stamp-edit
                // Use injected stampHistoryService
                List<Map<String,Object>> stampHistoryList = stampHistoryService.execute(year, month, employeeId);
                List<String> yearList = stampHistoryService.getYearList();
                List<String> monthList = stampHistoryService.getMonthList();
                model.addAttribute("stampHistoryList", stampHistoryList);
                model.addAttribute("selectYear", year);
                model.addAttribute("selectMonth", month);
                model.addAttribute("yearList", yearList);
                model.addAttribute("monthList", monthList);
                return "./stampedit/stamp-edit";
            }
        } catch (Exception e) {
            System.out.println("例外発生" + e);
            return "error";
        }
    }

    private boolean isStampChanged(StampEditForm form, StampHistoryService01 stampHistoryService, String year, String month, int employeeId) {
        List<Map<String, Object>> currentList = stampHistoryService.execute(year, month, employeeId);
        List<Map<String, Object>> newList = form.getStampEdit();
        if (currentList == null || newList == null) return false;
        if (currentList.size() != newList.size()) return true;
        for (int i = 0; i < currentList.size(); i++) {
            Map<String, Object> curr = currentList.get(i);
            Map<String, Object> next = newList.get(i);
            String currIn = curr.get("in_time") != null ? curr.get("in_time").toString() : "";
            String nextIn = next.get("inTime") != null ? next.get("inTime").toString() : "";
            String currOut = curr.get("out_time") != null ? curr.get("out_time").toString() : "";
            String nextOut = next.get("outTime") != null ? next.get("outTime").toString() : "";
            if (!currIn.equals(nextIn) || !currOut.equals(nextOut)) {
                return true;
            }
        }
        return false;
    }

    @GetMapping("view")
    public String viewAfterRegistration(
        @RequestParam String year,
        @RequestParam String month,
        @RequestParam int employeeId,
        Model model,
        HttpSession session,
        RedirectAttributes redirectAttributes
    ) {
        String redirect = SessionUtil.checkSession(session, redirectAttributes);
        if (redirect != null) return redirect;
        return view("search", year, month, employeeId, model, session, redirectAttributes);
    }
}
