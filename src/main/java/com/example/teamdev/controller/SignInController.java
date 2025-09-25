package com.example.teamdev.controller;

import com.example.teamdev.form.SignInForm;
import com.example.teamdev.util.MessageUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Controller;
import org.springframework.context.annotation.Profile;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Profile("legacy-ui")
@Controller
@RequestMapping({"/", "/signin"})
public class SignInController {

    private static final Logger logger = LoggerFactory.getLogger(SignInController.class);

    @GetMapping({"", "/"})
    public String getInit(Model model, @RequestParam(value = "error", required = false) String error,
                          @RequestParam(value = "logout", required = false) String logout) {
        if (error != null) {
            model.addAttribute("error", MessageUtil.getMessage("auth.login.error"));
        }
        if (logout != null) {
            model.addAttribute("message", MessageUtil.getMessage("auth.logout.success"));
        }
        return view(model);
    }

    @PostMapping("logout")
    public String logout(HttpServletRequest request, RedirectAttributes redirectAttributes) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            new SecurityContextLogoutHandler().logout(request, null, auth);
            logger.info("User logged out: {}", auth.getName());
        }
        redirectAttributes.addFlashAttribute("message", MessageUtil.getMessage("auth.logout.success"));
        return "redirect:/signin";
    }

    private String view(Model model) {
        model.addAttribute("form", new SignInForm());
        return "./signin/signin";
    }
}
