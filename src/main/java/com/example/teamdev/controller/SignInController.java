package com.example.teamdev.controller;

import com.example.teamdev.form.SignInForm;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/signin")
public class SignInController {

    private static final Logger logger = LoggerFactory.getLogger(SignInController.class);

    @GetMapping({"", "/"})
    public String getInit(Model model) {
        return view(model);
    }

    @PostMapping("init")
    public String postInit(HttpSession session, RedirectAttributes redirectAttributes) {
        logger.info("Signing out and invalidating session.");
        session.invalidate();
        redirectAttributes.addFlashAttribute("message", "サインアウトしました。");
        return "redirect:/signin";
    }

    private String view(Model model) {
        model.addAttribute("form", new SignInForm());
        return "./signin/signin";
    }
}
