package com.example.teamdev.controller;

import com.example.teamdev.dto.DataTablesRequest;
import com.example.teamdev.dto.DataTablesResponse;
import com.example.teamdev.form.StampOutputForm;
import com.example.teamdev.service.EmployeeService;
import com.example.teamdev.service.StampHistoryService;
import com.example.teamdev.service.StampOutputService;
import com.example.teamdev.util.SpringSecurityModelUtil;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.io.IOException;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("stampoutput")
public class StampOutputController {

    private static final Logger logger = LoggerFactory.getLogger(StampOutputController.class);

    private final EmployeeService employeeService;
    private final StampHistoryService stampHistoryService;
    private final StampOutputService stampOutputService;

    @Autowired
    public StampOutputController(EmployeeService employeeService, StampHistoryService stampHistoryService, StampOutputService stampOutputService) {
        this.employeeService = employeeService;
        this.stampHistoryService = stampHistoryService;
        this.stampOutputService = stampOutputService;
    }

    @PostMapping("init")
    public String init(Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        return view(model, session, redirectAttributes);
    }

    @PostMapping("output")
    public String output(HttpServletResponse response, @Validated StampOutputForm stampOutputForm, BindingResult bindingResult, Model model, RedirectAttributes redirectAttributes, HttpSession session) throws IOException {
        if (bindingResult.hasErrors()) {
            logger.warn("CSV output form validation errors:");
            for (FieldError error : bindingResult.getFieldErrors()) {
                logger.warn("Field: {}, Error: {}", error.getField(), error.getDefaultMessage());
            }
            model.addAttribute("result", "出力条件を確認してください。");
            return view(model, session, redirectAttributes);
        }

        Integer updateEmployeeId = SpringSecurityModelUtil.getCurrentEmployeeId(model, redirectAttributes);
        if (updateEmployeeId == null) {
            return view(model, session, redirectAttributes);
        }

        stampOutputService.execute(response, stampOutputForm, updateEmployeeId);
        return null;
    }

    @PostMapping("data")
    @ResponseBody
    public DataTablesResponse<Map<String, Object>> getEmployeeData(@RequestBody DataTablesRequest request, 
                                                                   @RequestParam(value = "userType", defaultValue = "general") String userType) {
        try {
            int adminFlag = "admin".equals(userType) ? 1 : 0;
            List<com.example.teamdev.entity.Employee> employees = employeeService.getAllEmployees(adminFlag);
            
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
            logger.error("Exception occurred while fetching employee data for DataTables", e);
            return new DataTablesResponse<>();
        }
    }

    private String view(Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        String navRedirect = SpringSecurityModelUtil.setNavigation(model, redirectAttributes);
        if (navRedirect != null) {
            return navRedirect;
        }

        List<com.example.teamdev.entity.Employee> employeeList = employeeService.getAllEmployees(0);
        List<com.example.teamdev.entity.Employee> adminList = employeeService.getAllEmployees(1);

        LocalDate currentDate = LocalDate.now();
        String year = String.valueOf(currentDate.getYear());
        String month = String.format("%02d", currentDate.getMonthValue());
        List<String> yearList = stampHistoryService.getYearList();
        List<String> monthList = stampHistoryService.getMonthList();

        model.addAttribute("employeeList", employeeList);
        model.addAttribute("adminList", adminList);
        model.addAttribute("selectYear", year);
        model.addAttribute("selectMonth", month);
        model.addAttribute("yearList", yearList);
        model.addAttribute("monthList", monthList);

        if (!model.containsAttribute("stampOutputForm")) {
            model.addAttribute("stampOutputForm", new StampOutputForm());
        }

        return "./stampoutput/stamp-output";
    }
}