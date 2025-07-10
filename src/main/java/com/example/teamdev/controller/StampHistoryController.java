package com.example.teamdev.controller;

import com.example.teamdev.form.StampHistoryForm;
import com.example.teamdev.service.StampHistoryService;
import com.example.teamdev.util.ModelUtil;
import com.example.teamdev.util.SessionUtil;
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

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("stamphistory")
public class StampHistoryController {

    private static final Logger logger = LoggerFactory.getLogger(StampHistoryController.class);

    private final StampHistoryService stampHistoryService;

    @Autowired
    public StampHistoryController(StampHistoryService stampHistoryService) {
        this.stampHistoryService = stampHistoryService;
    }

    @PostMapping("init")
    public String init(Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        LocalDate currentDate = LocalDate.now();
        String year = String.valueOf(currentDate.getYear());
        String month = String.format("%02d", currentDate.getMonthValue());
        return view(year, month, model, session, redirectAttributes);
    }

    @PostMapping("search")
    public String search(@Validated StampHistoryForm stampHistoryForm, BindingResult bindingResult, Model model, RedirectAttributes redirectAttributes, HttpSession session) {
        if (bindingResult.hasErrors()) {
            logger.warn("Validation errors:");
            for (FieldError error : bindingResult.getFieldErrors()) {
                logger.warn("Field: {}, Error: {}", error.getField(), error.getDefaultMessage());
            }
            model.addAttribute("errorMessage", "検索条件にエラーがあります。入力内容を確認してください。");
            return view(String.valueOf(LocalDate.now().getYear()), String.format("%02d", LocalDate.now().getMonthValue()), model, session, redirectAttributes);
        }

        return view(stampHistoryForm.getYear(), stampHistoryForm.getMonth(), model, session, redirectAttributes);
    }

    private String view(String year, String month, Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        String navRedirect = ModelUtil.setNavigation(model, session, redirectAttributes);
        if (navRedirect != null) {
            return navRedirect;
        }

        Map<String, Object> employeeMap = (Map<String, Object>) session.getAttribute("employeeMap");
        Integer employeeId = Integer.parseInt(employeeMap.get("id").toString());

        List<Map<String, Object>> stampHistoryList = stampHistoryService.execute(year, month, employeeId);
        List<String> yearList = stampHistoryService.getYearList();
        List<String> monthList = stampHistoryService.getMonthList();

        model.addAttribute("stampHistoryList", stampHistoryList);
        model.addAttribute("selectYear", year);
        model.addAttribute("selectMonth", month);
        model.addAttribute("yearList", yearList);
        model.addAttribute("monthList", monthList);

        return "./stamphistory/stamp-history";
    }
}