package com.example.teamdev.controller;

import com.example.teamdev.form.StampOutputForm;
import com.example.teamdev.service.EmployeeService;
import com.example.teamdev.service.StampHistoryService;
import com.example.teamdev.service.StampOutputService;
import com.example.teamdev.util.ModelUtil;
import com.example.teamdev.util.SessionUtil;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@Controller
@RequestMapping("stampoutput")
public class StampOutputController {

    private static final Logger logger = LoggerFactory.getLogger(StampOutputController.class);

    private final EmployeeService employeeService;
    private final StampHistoryService stampHistoryService;
    private final StampOutputService stampOutputService;

    @Autowired
    public StampOutputController(EmployeeService employeeService, StampHistoryService stampHistoryService, StampOutputService stampOutputService) {
        this.employeeService = employeeService;
        this.stampHistoryService = stampHistoryService;
        this.stampOutputService = stampOutputService;
    }

    @PostMapping("init")
    public String init(Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        return view(model, session, redirectAttributes);
    }

    @PostMapping("output")
    public String output(HttpServletResponse response, @Validated StampOutputForm stampOutputForm, BindingResult bindingResult, Model model, RedirectAttributes redirectAttributes, HttpSession session) throws IOException {
        if (bindingResult.hasErrors()) {
            logger.warn("CSV output form validation errors:");
            for (FieldError error : bindingResult.getFieldErrors()) {
                logger.warn("Field: {}, Error: {}", error.getField(), error.getDefaultMessage());
            }
            model.addAttribute("result", "出力条件を確認してください。");
            return view(model, session, redirectAttributes);
        }

        Integer updateEmployeeId = SessionUtil.getLoggedInEmployeeId(session, model, redirectAttributes);
        if (updateEmployeeId == null) {
            return view(model, session, redirectAttributes);
        }

        stampOutputService.execute(response, stampOutputForm, updateEmployeeId);
        return null;
    }

    private String view(Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        String navRedirect = ModelUtil.setNavigation(model, session, redirectAttributes);
        if (navRedirect != null) {
            return navRedirect;
        }

        List<com.example.teamdev.entity.Employee> employeeList = employeeService.getAllEmployees(0);
        List<com.example.teamdev.entity.Employee> adminList = employeeService.getAllEmployees(1);

        LocalDate currentDate = LocalDate.now();
        String year = String.valueOf(currentDate.getYear());
        String month = String.format("%02d", currentDate.getMonthValue());
        List<String> yearList = stampHistoryService.getYearList();
        List<String> monthList = stampHistoryService.getMonthList();

        model.addAttribute("employeeList", employeeList);
        model.addAttribute("adminList", adminList);
        model.addAttribute("selectYear", year);
        model.addAttribute("selectMonth", month);
        model.addAttribute("yearList", yearList);
        model.addAttribute("monthList", monthList);

        if (!model.containsAttribute("stampOutputForm")) {
            model.addAttribute("stampOutputForm", new StampOutputForm());
        }

        return "./stampoutput/stamp-output";
    }
}