package com.example.teamdev.controller;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.teamdev.form.StampOutputForm;
// Import EmployeeService
import com.example.teamdev.service.EmployeeService;
// Remove: import com.example.teamdev.service.EmployeeListService01;
import com.example.teamdev.service.StampHistoryService01;
import com.example.teamdev.service.StampOutputService01;
import com.example.teamdev.util.ModelUtil;
import com.example.teamdev.util.SessionUtil;

@Controller
@RequestMapping("stampoutput")
public class StampOutputController {

    // Change type to EmployeeService and rename variable for clarity
    private final EmployeeService employeeService;
    private final StampHistoryService01 stampHistoryService; // Renamed for consistency from service02
    private final StampOutputService01 stampOutputService;   // Renamed for consistency from service03

    @Autowired
    public StampOutputController(
            EmployeeService employeeService,
            StampHistoryService01 stampHistoryService,
            StampOutputService01 stampOutputService) {
        this.employeeService = employeeService;
        this.stampHistoryService = stampHistoryService;
        this.stampOutputService = stampOutputService;
    }

    @PostMapping("init")
    public String init(
            Model model,
            HttpSession session,
            RedirectAttributes redirectAttributes) {
        return view(model, session, redirectAttributes);
    }

    @PostMapping("output")
    public String output(
        HttpServletResponse response,
        @Validated StampOutputForm stampOutputForm,
        BindingResult bindingResult,
        Model model,
        RedirectAttributes redirectAttributes,
        HttpSession session
    ) {
        Map<String, Object> employeeMap = (Map<String, Object>) session.getAttribute("employeeMap");
        Integer updateEmployeeId = Integer.parseInt(employeeMap.get("id").toString());

        if (!bindingResult.hasErrors()) {
            try {
                // Use the correctly named service variable
                stampOutputService.execute(response, stampOutputForm, updateEmployeeId);
            } catch (Exception e) {
                System.out.println("例外発生" + e);
            }
        } else {
            System.out.println("Validation errors:");
            for (FieldError error : bindingResult.getFieldErrors()) {
                System.out.println("Field: " + error.getField() + ", Error: " + error.getDefaultMessage());
            }
        }
        model.addAttribute("result", "出力する従業員情報を1件選択してください");
        return view(model, session, redirectAttributes);
    }

    public String view(
            Model model,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        String redirect = SessionUtil.checkSession(session, redirectAttributes);
        if (redirect != null)
            return redirect;

        ModelUtil.setNavigation(model, session);

        try {
            // Use the new service method
            List<Map<String,Object>>employeeList = employeeService.getAllEmployees(0);
            List<Map<String,Object>> adminList = employeeService.getAllEmployees(1);

            LocalDate currentDate = LocalDate.now();
            String year = String.valueOf(currentDate.getYear());
            String month = String.format("%02d", currentDate.getMonthValue());
            // Use the correctly named service variable
            List<String> yearList = stampHistoryService.getYearList();
            List<String> monthList = stampHistoryService.getMonthList();

            model.addAttribute("employeeList", employeeList);
            model.addAttribute("adminList", adminList);
            model.addAttribute("selectYear", year);
            model.addAttribute("selectMonth", month);
            model.addAttribute("yearList", yearList);
            model.addAttribute("monthList", monthList);

            return "./stampoutput/stamp-output";
        } catch (Exception e) {
            System.out.println("例外発生" + e);
            return "error";
        }
    }
}
