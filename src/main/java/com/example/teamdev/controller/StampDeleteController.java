package com.example.teamdev.controller;

import com.example.teamdev.form.StampDeleteForm;
import com.example.teamdev.service.StampDeleteService;
import com.example.teamdev.service.StampHistoryService;
import com.example.teamdev.util.SpringSecurityModelUtil;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.context.annotation.Profile;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDate;
import java.util.List;

@Profile("legacy-ui")
@Controller
@RequestMapping("stampdelete")
public class StampDeleteController {

    private static final Logger logger = LoggerFactory.getLogger(StampDeleteController.class);

    private final StampDeleteService stampDeleteService;
    private final StampHistoryService stampHistoryService;

    @Autowired
    public StampDeleteController(StampDeleteService stampDeleteService, StampHistoryService stampHistoryService) {
        this.stampDeleteService = stampDeleteService;
        this.stampHistoryService = stampHistoryService;
    }

    @PostMapping("init")
    public String init(@ModelAttribute StampDeleteForm stampDeleteForm, Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        LocalDate currentDate = LocalDate.now();
        String year = String.valueOf(currentDate.getYear());
        String month = String.format("%02d", currentDate.getMonthValue());
        return view(stampDeleteForm, year, month, model, session, redirectAttributes);
    }

    @PostMapping("delete")
    public String delete(@ModelAttribute @Validated StampDeleteForm stampDeleteForm, BindingResult result, Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            return view(stampDeleteForm, stampDeleteForm.getStartYear(), stampDeleteForm.getStartMonth(), model, session, redirectAttributes);
        }

        if (!stampDeleteService.validateYearMonthRange(stampDeleteForm)) {
            result.rejectValue("startMonth", "error.date.range", "開始年月が終了年月より後の日付になっています");
            return view(stampDeleteForm, stampDeleteForm.getStartYear(), stampDeleteForm.getStartMonth(), model, session, redirectAttributes);
        }

        Integer updateEmployeeId = SpringSecurityModelUtil.getCurrentEmployeeId(model, redirectAttributes);
        if (updateEmployeeId == null) {
            return "redirect:/stampdelete/init";
        }

        int deletedCount = stampDeleteService.deleteStampsByYearMonthRange(stampDeleteForm, updateEmployeeId);
        redirectAttributes.addFlashAttribute("deletedCount", deletedCount);
        return "redirect:/stampdelete/result";
    }

    @GetMapping("result")
    public String result(@ModelAttribute StampDeleteForm stampDeleteForm, Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        String navRedirect = SpringSecurityModelUtil.setNavigation(model, redirectAttributes);
        if (navRedirect != null) {
            return navRedirect;
        }
        if (!model.containsAttribute("stampDeleteForm")) {
            model.addAttribute("stampDeleteForm", new StampDeleteForm());
        }
        return "stampdelete/result";
    }

    private String view(@ModelAttribute StampDeleteForm stampDeleteForm, String year, String month, Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        String navRedirect = SpringSecurityModelUtil.setNavigation(model, redirectAttributes);
        if (navRedirect != null) {
            return navRedirect;
        }

        List<String> yearList = stampHistoryService.getYearList();
        List<String> monthList = stampHistoryService.getMonthList();

        stampDeleteForm.setStartYear(year);
        stampDeleteForm.setStartMonth(month);
        stampDeleteForm.setEndYear(year);
        stampDeleteForm.setEndMonth(month);

        model.addAttribute("yearList", yearList);
        model.addAttribute("monthList", monthList);

        return "stampdelete/init";
    }
}