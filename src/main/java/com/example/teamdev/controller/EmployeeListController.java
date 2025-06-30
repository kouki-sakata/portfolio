package com.example.teamdev.controller;

import com.example.teamdev.entity.Employee;
import com.example.teamdev.service.EmployeeService;
import com.example.teamdev.util.ModelUtil;
import com.example.teamdev.util.SessionUtil;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;

@Controller
@RequestMapping("employeelist")
public class EmployeeListController {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeListController.class);

    private final EmployeeService employeeService;

    @Autowired
    public EmployeeListController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @PostMapping("init")
    public String init(Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        return view(model, session, redirectAttributes);
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

        List<Employee> employeeList = employeeService.getAllEmployees(0);
        List<Employee> adminList = employeeService.getAllEmployees(1);

        model.addAttribute("employeeList", employeeList);
        model.addAttribute("adminList", adminList);
        return "./employeelist/employee-list";
    }
}