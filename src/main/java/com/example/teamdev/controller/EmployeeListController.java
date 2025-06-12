package com.example.teamdev.controller;

import java.util.ArrayList; // Keep this if new ArrayList<>() is used, though service returns List
import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping; // Added for RequestMapping
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

// Import EmployeeService
import com.example.teamdev.service.EmployeeService;
// Remove: import com.example.teamdev.service.EmployeeListService01;
import com.example.teamdev.util.ModelUtil;
import com.example.teamdev.util.SessionUtil;

@Controller
@RequestMapping("employeelist") // Ensure RequestMapping is present
public class EmployeeListController {

    private final EmployeeService employeeService; // Changed type and name

    @Autowired
    public EmployeeListController(EmployeeService employeeService) { // Constructor injection
        this.employeeService = employeeService;
    }

    @PostMapping("init")
    public String init(
            Model model,
            HttpSession session,
            RedirectAttributes redirectAttributes) {
        return view(model, session, redirectAttributes);
    }

    public String view(
            Model model,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        String redirect = SessionUtil.checkSession(session, redirectAttributes);
        if (redirect != null)
            return redirect;

        try {
            ModelUtil.setNavigation(model, session);

            // Use the new service method
            List<Map<String,Object>> employeeList = employeeService.getAllEmployees(0);
            List<Map<String,Object>> adminList = employeeService.getAllEmployees(1);

            model.addAttribute("employeeList", employeeList);
            model.addAttribute("adminList", adminList);
            return "./employeelist/employee-list";
        } catch (Exception e) {
            System.out.println("例外発生" + e);
            return "error";
        }
    }
}
