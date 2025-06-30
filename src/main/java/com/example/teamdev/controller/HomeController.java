package com.example.teamdev.controller;

import com.example.teamdev.entity.Employee;
import com.example.teamdev.form.HomeForm;
import com.example.teamdev.form.SignInForm;
import com.example.teamdev.service.AuthenticationService;
import com.example.teamdev.service.HomeNewsService;
import com.example.teamdev.service.StampService;
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
    private final AuthenticationService authenticationService;

    @Autowired
    public HomeController(HomeNewsService homeNewsService, StampService stampService, AuthenticationService authenticationService) {
        this.homeNewsService = homeNewsService;
        this.stampService = stampService;
        this.authenticationService = authenticationService;
    }

    @PostMapping("init")
    public String init(Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        return view(model, session, redirectAttributes);
    }

    @GetMapping("init")
    public String initGet(Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        return view(model, session, redirectAttributes);
    }

    @PostMapping("check")
    public String check(@Validated SignInForm signInForm, BindingResult bindingResult, Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        if (bindingResult.hasErrors()) {
            logger.warn("Sign-in form validation errors:");
            for (FieldError error : bindingResult.getFieldErrors()) {
                logger.warn("Field: {}, Error: {}", error.getField(), error.getDefaultMessage());
            }
            redirectAttributes.addFlashAttribute("result", "EmailまたはPasswordが空白になっています");
            return "redirect:/signin";
        }

        Employee employee = new Employee();
        employee.setEmail(signInForm.getEmail());
        employee.setPassword(signInForm.getPassword());

        Map<String, Object> employeeMap = authenticationService.execute(employee);

        if (employeeMap.containsKey("signInTime")) {
            session.setAttribute("employeeMap", employeeMap);
            return view(model, session, redirectAttributes);
        } else {
            redirectAttributes.addFlashAttribute("result", "EmailまたはPasswordが一致しません");
            return "redirect:/signin";
        }
    }

    @PostMapping("regist")
    public String regist(@Validated HomeForm homeForm, BindingResult bindingResult, Model model, RedirectAttributes redirectAttributes, HttpSession session) {
        String redirect = SessionUtil.checkSession(session, redirectAttributes);
        if (redirect != null) {
            return redirect;
        }

        if (bindingResult.hasErrors()) {
            logger.warn("Stamp form validation errors:");
            for (FieldError error : bindingResult.getFieldErrors()) {
                logger.warn("Field: {}, Error: {}", error.getField(), error.getDefaultMessage());
            }
            redirectAttributes.addFlashAttribute("result", "打刻情報に不備があります。入力内容を確認してください。");
            return "redirect:/home/init";
        }

        Integer employeeId = SessionUtil.getLoggedInEmployeeId(session, model, redirectAttributes);
        if (employeeId == null) {
            return "redirect:/home/init";
        }

        stampService.execute(homeForm, employeeId);

        LocalDateTime dateTime = LocalDateTime.parse(homeForm.getStampTime(), DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        String newDateTimeString = dateTime.format(DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss"));
        String type = homeForm.getStampType().equals("1") ? "出勤" : "退勤";

        redirectAttributes.addFlashAttribute("result", type + "時刻を登録しました。（" + newDateTimeString + "）");
        return "redirect:/home/init";
    }

    private String view(Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        String redirect = SessionUtil.checkSession(session, redirectAttributes);
        if (redirect != null) {
            return redirect;
        }

        String navRedirect = ModelUtil.setNavigation(model, session, redirectAttributes);
        if (navRedirect != null) {
            return navRedirect;
        }

        List<Map<String, Object>> newsList = homeNewsService.execute();
        model.addAttribute("newsList", newsList);

        return "./home/home";
    }
}