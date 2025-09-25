package com.example.teamdev.controller;

import com.example.teamdev.dto.DataTablesRequest;
import com.example.teamdev.dto.DataTablesResponse;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.form.StampEditForm;
import com.example.teamdev.service.EmployeeService;
import com.example.teamdev.service.StampEditService;
import com.example.teamdev.service.StampHistoryService;
import com.example.teamdev.util.SpringSecurityModelUtil;
import com.example.teamdev.util.TimeFormatUtil;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.context.annotation.Profile;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Profile("legacy-ui")
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
            if (!StringUtils.hasText(year)) {
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

        Integer updateEmployeeId = SpringSecurityModelUtil.getCurrentEmployeeId(model, redirectAttributes);
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

    @PostMapping("data")
    @ResponseBody
    public DataTablesResponse<Map<String, Object>> getSelectEmployeeData(@RequestBody DataTablesRequest request, 
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
            logger.error("Exception occurred while fetching select employee data for DataTables", e);
            return new DataTablesResponse<>();
        }
    }

    @GetMapping("view")
    public String viewAfterRegistration(@RequestParam String year, @RequestParam String month, @RequestParam int employeeId, Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        return view("view", year, month, employeeId, model, session, redirectAttributes);
    }

    private String view(String type, String year, String month, int employeeId, Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        String navRedirect = SpringSecurityModelUtil.setNavigation(model, redirectAttributes);
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
