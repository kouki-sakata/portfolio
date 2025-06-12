package com.example.teamdev.controller.advice;

import com.example.teamdev.exception.DuplicateEmailException;
import com.example.teamdev.exception.EmployeeNotFoundException;
import jakarta.servlet.http.HttpServletRequest; // For logging request details
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.mvc.support.RedirectAttributes; // If redirecting with flash attributes

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Handling for DuplicateEmailException
    // This handler redirects back to what is assumed to be the referring page or a specific form page
    // and adds the error message. This is tricky without knowing the exact form page for all contexts.
    // For EmployeeManageController, it was "./employeemanage/employee-manage".
    // A more generic approach might be to return a dedicated error view.
    // For now, let's assume we want to redirect and show the message on the form.
    // This is hard to make truly generic without more context or conventions.
    // A common pattern is to redirect to a path stored in session or a known referer.
    // Let's try to redirect to "/employeemanage/init" as that's where the form is.
    // This is a specific choice for this exception type related to employee management.
    @ExceptionHandler(DuplicateEmailException.class)
    public String handleDuplicateEmailException(DuplicateEmailException ex, RedirectAttributes redirectAttributes, HttpServletRequest request) {
        logger.warn("DuplicateEmailException caught globally: {} for request URI {}", ex.getMessage(), request.getRequestURI());
        redirectAttributes.addFlashAttribute("globalError", ex.getMessage());
        // Attempt to redirect to the most relevant page, which is employee management form in this context
        // If this exception could occur from other forms, this redirect would be wrong.
        return "redirect:/employeemanage/init"; // Or a more generic error display page
    }

    // Handling for EmployeeNotFoundException
    @ExceptionHandler(EmployeeNotFoundException.class)
    public String handleEmployeeNotFoundException(EmployeeNotFoundException ex, RedirectAttributes redirectAttributes, HttpServletRequest request) {
        logger.warn("EmployeeNotFoundException caught globally: {} for request URI {}", ex.getMessage(), request.getRequestURI());
        redirectAttributes.addFlashAttribute("globalError", ex.getMessage());
        // Similar to above, redirecting to a relevant page.
        return "redirect:/employeemanage/init"; // Or a more generic error display page
    }

    // Handling for NumberFormatException (example, if it's common)
    @ExceptionHandler(NumberFormatException.class)
    public String handleNumberFormatException(NumberFormatException ex, Model model, HttpServletRequest request) {
        logger.error("NumberFormatException caught globally: {} for request URI {}", ex.getMessage(), request.getRequestURI());
        model.addAttribute("errorMessage", "入力された数値の形式が正しくありません。");
        model.addAttribute("details", ex.getMessage());
        return "error"; // Generic error page
    }


    // Generic handler for other exceptions
    @ExceptionHandler(Exception.class)
    public String handleGenericException(Exception ex, Model model, HttpServletRequest request) {
        logger.error("UnhandledException caught globally: {} for request URI {}", ex.getMessage(), request.getRequestURI(), ex);
        model.addAttribute("errorMessage", "予期せぬエラーが発生しました。システム管理者にお問い合わせください。");
        // Optionally, add more details for admin/dev if in a dev environment
        // model.addAttribute("details", ex.getClass().getName() + ": " + ex.getMessage());
        return "error"; // Name of a generic error view template (e.g., error.html)
    }
}
