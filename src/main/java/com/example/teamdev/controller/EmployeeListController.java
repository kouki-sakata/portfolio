package com.example.teamdev.controller;

import com.example.teamdev.dto.DataTablesRequest;
import com.example.teamdev.dto.DataTablesResponse;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.service.EmployeeService;
import com.example.teamdev.util.SpringSecurityModelUtil;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    @PostMapping("data")
    @ResponseBody
    public DataTablesResponse<Map<String, Object>> getEmployeeListData(@RequestBody DataTablesRequest request, 
                                                                       @RequestParam(value = "userType", defaultValue = "general") String userType) {
        try {
            int adminFlag = "admin".equals(userType) ? 1 : 0;
            List<Employee> employees = employeeService.getAllEmployees(adminFlag);
            
            List<Map<String, Object>> employeeDataList = employees.stream()
                .map(employee -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("id", employee.getId());
                    data.put("firstName", employee.getFirst_name());
                    data.put("lastName", employee.getLast_name());
                    data.put("fullName", employee.getFirst_name() + " " + employee.getLast_name());
                    data.put("email", employee.getEmail());
                    return data;
                })
                .toList();
            
            DataTablesResponse<Map<String, Object>> response = new DataTablesResponse<>();
            response.setDraw(request.getDraw());
            response.setRecordsTotal(employeeDataList.size());
            response.setRecordsFiltered(employeeDataList.size());
            response.setData(employeeDataList);
            
            return response;
        } catch (Exception e) {
            logger.error("Exception occurred while fetching employee list data for DataTables", e);
            return new DataTablesResponse<>();
        }
    }

    private String view(Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        String navRedirect = SpringSecurityModelUtil.setNavigation(model, redirectAttributes);
        if (navRedirect != null) {
            return navRedirect;
        }

        // N+1問題解決：一回のクエリで全従業員を取得し、Javaでグループ化
        Map<Integer, List<Employee>> employeesGrouped = employeeService.getEmployeesGroupedByAdminFlag();
        
        List<Employee> employeeList = employeesGrouped.getOrDefault(0, new ArrayList<>());
        List<Employee> adminList = employeesGrouped.getOrDefault(1, new ArrayList<>());

        model.addAttribute("employeeList", employeeList);
        model.addAttribute("adminList", adminList);
        return "./employeelist/employee-list";
    }
}