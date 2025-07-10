package com.example.teamdev.controller;

import com.example.teamdev.form.StampEditForm;
import com.example.teamdev.service.EmployeeService;
import com.example.teamdev.service.StampEditService;
import com.example.teamdev.service.StampHistoryService;
import com.example.teamdev.util.ModelUtil;
import com.example.teamdev.util.SessionUtil;
import com.example.teamdev.util.TimeFormatUtil;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import org.thymeleaf.util.StringUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("stampedit")
public class StampEditController {

    private static final Logger logger = LoggerFactory.getLogger(StampEditController.class);

    private final EmployeeService employeeService;
    private final StampHistoryService stampHistoryService;
    private final StampEditService stampEditService;

    @Autowired
    public StampEditController(EmployeeService employeeService, StampHistoryService stampHistoryService, StampEditService stampEditService) {
        this.employeeService = employeeService;
        this.stampHistoryService = stampHistoryService;
        this.stampEditService = stampEditService;
    }

    @PostMapping("init")
    public String init(Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        return view("init", "", "", 0, model, session, redirectAttributes);
    }

    @PostMapping("search")
    public String search(@Validated StampEditForm stampEditForm, BindingResult bindingResult, Model model, RedirectAttributes redirectAttributes, HttpSession session) {
        if (bindingResult.hasErrors()) {
            logger.warn("Search form validation errors:");
            for (FieldError error : bindingResult.getFieldErrors()) {
                logger.warn("Field: {}, Error: {}", error.getField(), error.getDefaultMessage());
            }
            return view("init", "", "", 0, model, session, redirectAttributes);
        }

        try {
            String employeeIdStr = stampEditForm.getEmployeeId();
            if (employeeIdStr.contains(",")) {
                employeeIdStr = employeeIdStr.split(",")[0];
            }
            int employeeId = Integer.parseInt(employeeIdStr);
            String year = stampEditForm.getYear();
            String month = stampEditForm.getMonth();
            if (StringUtils.isEmpty(year)) {
                LocalDate currentDate = LocalDate.now();
                year = String.valueOf(currentDate.getYear());
                month = String.format("%02d", currentDate.getMonthValue());
            }
            return view("search", year, month, employeeId, model, session, redirectAttributes);
        } catch (NumberFormatException e) {
            logger.error("Invalid employee ID format: {}", stampEditForm.getEmployeeId(), e);
            model.addAttribute("errorMessage", "従業員IDの形式が正しくありません。");
            return view("init", "", "", 0, model, session, redirectAttributes);
        }
    }

    @PostMapping("regist")
    public String regist(@Validated StampEditForm stampEditForm, BindingResult bindingResult, Model model, RedirectAttributes redirectAttributes, HttpSession session) {
        if (bindingResult.hasErrors()) {
            logger.warn("Registration form validation errors:");
            for (FieldError error : bindingResult.getFieldErrors()) {
                logger.warn("Field: {}, Error: {}", error.getField(), error.getDefaultMessage());
            }
            return view("search", stampEditForm.getYear(), stampEditForm.getMonth(), Integer.parseInt(stampEditForm.getEmployeeId()), model, session, redirectAttributes);
        }

        Integer updateEmployeeId = SessionUtil.getLoggedInEmployeeId(session, model, redirectAttributes);
        if (updateEmployeeId == null) {
            return view("init", "", "", 0, model, session, redirectAttributes);
        }

        int employeeId = Integer.parseInt(stampEditForm.getEmployeeId());
        String year = stampEditForm.getYear();
        String month = stampEditForm.getMonth();

        if (!isStampChanged(stampEditForm, stampHistoryService, year, month, employeeId)) {
            model.addAttribute("result", "変更箇所がありません。");
            return view("search", year, month, employeeId, model, session, redirectAttributes);
        }

        stampEditService.execute(stampEditForm.getStampEdit(), updateEmployeeId);
        redirectAttributes.addFlashAttribute("result", "登録しました。");
        return "redirect:/stampedit/view?year=" + year + "&month=" + month + "&employeeId=" + employeeId;
    }

    @GetMapping("view")
    public String viewAfterRegistration(@RequestParam String year, @RequestParam String month, @RequestParam int employeeId, Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        String redirect = SessionUtil.checkSession(session, redirectAttributes);
        if (redirect != null) return redirect;
        return view("search", year, month, employeeId, model, session, redirectAttributes);
    }

    private String view(String type, String year, String month, int employeeId, Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        String navRedirect = ModelUtil.setNavigation(model, session, redirectAttributes);
        if (navRedirect != null) {
            return navRedirect;
        }

        if ("init".equals(type)) {
            List<com.example.teamdev.entity.Employee> employeeList = employeeService.getAllEmployees(0);
            List<com.example.teamdev.entity.Employee> adminList = employeeService.getAllEmployees(1);
            model.addAttribute("employeeList", employeeList);
            model.addAttribute("adminList", adminList);
            if (!model.containsAttribute("stampEditForm")) {
                model.addAttribute("stampEditForm", new StampEditForm());
            }
            return "./stampedit/select-employee";
        } else {
            List<Map<String, Object>> stampHistoryList = stampHistoryService.execute(year, month, employeeId);
            List<String> yearList = stampHistoryService.getYearList();
            List<String> monthList = stampHistoryService.getMonthList();

            model.addAttribute("stampHistoryList", stampHistoryList);
            model.addAttribute("selectYear", year);
            model.addAttribute("selectMonth", month);
            model.addAttribute("yearList", yearList);
            model.addAttribute("monthList", monthList);

            if (!model.containsAttribute("stampEditForm")) {
                StampEditForm form = new StampEditForm();
                form.setEmployeeId(String.valueOf(employeeId));
                form.setYear(year);
                form.setMonth(month);
                model.addAttribute("stampEditForm", form);
            } else {
                StampEditForm existingForm = (StampEditForm) model.getAttribute("stampEditForm");
                if (existingForm != null) {
                    existingForm.setEmployeeId(String.valueOf(employeeId));
                    existingForm.setYear(year);
                    existingForm.setMonth(month);
                }
            }
            model.addAttribute("selectedEmployeeId", employeeId);
            return "./stampedit/stamp-edit";
        }
    }

    private boolean isStampChanged(StampEditForm form, StampHistoryService stampHistoryService, String year, String month, int employeeId) {
        List<Map<String, Object>> currentList = stampHistoryService.execute(year, month, employeeId);
        List<Map<String, Object>> newList = form.getStampEdit();

        if (currentList == null || newList == null || currentList.size() != newList.size()) {
            return true;
        }

        for (int i = 0; i < currentList.size(); i++) {
            Map<String, Object> curr = currentList.get(i);
            Map<String, Object> next = newList.get(i);

            String currInTime = TimeFormatUtil.formatTime(curr.get("in_time"));
            String nextInTime = TimeFormatUtil.formatTime(next.get("inTime"));
            String currOutTime = TimeFormatUtil.formatTime(curr.get("out_time"));
            String nextOutTime = TimeFormatUtil.formatTime(next.get("outTime"));

            if (!currInTime.equals(nextInTime) || !currOutTime.equals(nextOutTime)) {
                return true;
            }
        }
        return false;
    }
}
