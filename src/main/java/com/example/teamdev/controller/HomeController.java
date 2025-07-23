package com.example.teamdev.controller;

import com.example.teamdev.constant.AppConstants;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.form.HomeForm;
import com.example.teamdev.service.HomeNewsService;
import com.example.teamdev.service.StampService;
import com.example.teamdev.util.MessageUtil;
import com.example.teamdev.util.SecurityUtil;
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
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("home")
public class HomeController {

    private static final Logger logger = LoggerFactory.getLogger(HomeController.class);

    private final HomeNewsService homeNewsService;
    private final StampService stampService;

    @Autowired
    public HomeController(HomeNewsService homeNewsService, StampService stampService) {
        this.homeNewsService = homeNewsService;
        this.stampService = stampService;
    }

    @PostMapping("init")
    public String init(Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        return view(model, session, redirectAttributes);
    }

    @GetMapping("init")
    public String initGet(Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        return view(model, session, redirectAttributes);
    }


    @PostMapping("regist")
    public String regist(@Validated HomeForm homeForm, BindingResult bindingResult, Model model, RedirectAttributes redirectAttributes, HttpSession session) {
        if (bindingResult.hasErrors()) {
            logger.warn("Stamp form validation errors:");
            for (FieldError error : bindingResult.getFieldErrors()) {
                logger.warn("Field: {}, Error: {}", error.getField(), error.getDefaultMessage());
            }
            redirectAttributes.addFlashAttribute("result", MessageUtil.getMessage("stamp.validation.error"));
            return "redirect:/home/init";
        }

        Integer employeeId = SecurityUtil.getCurrentEmployeeId();
        if (employeeId == null) {
            redirectAttributes.addFlashAttribute("result", MessageUtil.getMessage("stamp.user.error"));
            return "redirect:/home/init";
        }

        stampService.execute(homeForm, employeeId);

        LocalDateTime dateTime = LocalDateTime.parse(homeForm.getStampTime(), DateTimeFormatter.ofPattern(AppConstants.DateFormat.ISO_LOCAL_DATE_TIME));
        String newDateTimeString = dateTime.format(DateTimeFormatter.ofPattern(AppConstants.DateFormat.DISPLAY_DATE_TIME));
        
        String messageKey = homeForm.getStampType().equals(AppConstants.Stamp.TYPE_ATTENDANCE) ? 
                           "stamp.attendance.success" : "stamp.departure.success";
        String message = MessageUtil.getMessage(messageKey, new Object[]{newDateTimeString});
        
        redirectAttributes.addFlashAttribute("result", message);
        return "redirect:/home/init";
    }

    private String view(Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        // Spring Securityから現在のユーザー情報を取得
        Employee currentEmployee = SecurityUtil.getCurrentEmployee();
        if (currentEmployee != null) {
            model.addAttribute("currentUser", currentEmployee);
            model.addAttribute("employeeName", currentEmployee.getFirst_name() + "　" + currentEmployee.getLast_name());
            // 管理者フラグをmodelに追加（ナビゲーションメニューで使用）
            model.addAttribute("adminFlag", String.valueOf(currentEmployee.getAdmin_flag()));
        }

        List<Map<String, Object>> newsList = homeNewsService.execute();
        model.addAttribute("newsList", newsList);

        return "./home/home";
    }
}