package com.example.teamdev.controller;

import com.example.teamdev.dto.DataTablesRequest;
import com.example.teamdev.dto.DataTablesResponse;
import com.example.teamdev.form.StampHistoryForm;
import com.example.teamdev.service.LogHistoryQueryService;
import com.example.teamdev.service.StampHistoryService;
import com.example.teamdev.util.SpringSecurityModelUtil;
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

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@Controller
@RequestMapping("loghistory")
public class LogHistoryController {

    private static final Logger logger = LoggerFactory.getLogger(LogHistoryController.class);

    private final StampHistoryService stampHistoryService;
    private final LogHistoryQueryService logHistoryQueryService;

    @Autowired
    public LogHistoryController(StampHistoryService stampHistoryService, LogHistoryQueryService logHistoryQueryService) {
        this.stampHistoryService = stampHistoryService;
        this.logHistoryQueryService = logHistoryQueryService;
    }

    @PostMapping("init")
    public String init(Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        LocalDate currentDate = LocalDate.now();
        String year = String.valueOf(currentDate.getYear());
        String month = String.format("%02d", currentDate.getMonthValue());
        return view(year, month, model, session, redirectAttributes);
    }

    @PostMapping("search")
    public String search(@Validated StampHistoryForm stampHistoryForm, BindingResult bindingResult, Model model, RedirectAttributes redirectAttributes, HttpSession session) {
        if (bindingResult.hasErrors()) {
            logger.warn("Validation errors in search form:");
            for (FieldError error : bindingResult.getFieldErrors()) {
                logger.warn("Field: {}, Error: {}", error.getField(), error.getDefaultMessage());
            }
            model.addAttribute("errorMessage", "検索条件にエラーがあります。入力内容を確認してください。");
            return view(String.valueOf(LocalDate.now().getYear()), String.format("%02d", LocalDate.now().getMonthValue()), model, session, redirectAttributes);
        }

        return view(stampHistoryForm.getYear(), stampHistoryForm.getMonth(), model, session, redirectAttributes);
    }

    @PostMapping("data")
    @ResponseBody
    public DataTablesResponse<Map<String, Object>> getLogHistoryData(@RequestBody DataTablesRequest request,
                                                                     @RequestParam(value = "year", defaultValue = "") String year,
                                                                     @RequestParam(value = "month", defaultValue = "") String month) {
        try {
            // デフォルト値設定
            if (year.isEmpty() || month.isEmpty()) {
                LocalDate currentDate = LocalDate.now();
                year = String.valueOf(currentDate.getYear());
                month = String.format("%02d", currentDate.getMonthValue());
            }

            List<Map<String, Object>> logHistoryList = logHistoryQueryService.execute(year, month);

            // データを連番付きで変換
            AtomicInteger counter = new AtomicInteger(1);
            List<Map<String, Object>> logHistoryDataList = logHistoryList.stream()
                .map(logHistory -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("index", counter.getAndIncrement());
                    data.put("update_date", logHistory.get("update_date"));
                    data.put("employee_name", logHistory.get("employee_name"));
                    data.put("display_name", logHistory.get("display_name"));
                    data.put("operation_type", logHistory.get("operation_type"));
                    data.put("stamp_time", logHistory.get("stamp_time"));
                    data.put("update_employee_name", logHistory.get("update_employee_name"));
                    return data;
                })
                .toList();

            DataTablesResponse<Map<String, Object>> response = new DataTablesResponse<>();
            response.setDraw(request.getDraw());
            response.setRecordsTotal(logHistoryDataList.size());
            response.setRecordsFiltered(logHistoryDataList.size());
            response.setData(logHistoryDataList);

            return response;
        } catch (Exception e) {
            logger.error("Exception occurred while fetching log history data for DataTables", e);
            return new DataTablesResponse<>();
        }
    }

    private String view(String year, String month, Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        String navRedirect = SpringSecurityModelUtil.setNavigation(model, redirectAttributes);
        if (navRedirect != null) {
            return navRedirect;
        }

        List<Map<String, Object>> logHistoryList = logHistoryQueryService.execute(year, month);
        List<String> yearList = logHistoryQueryService.getYearList();
        List<String> monthList = stampHistoryService.getMonthList();

        model.addAttribute("selectYear", year);
        model.addAttribute("selectMonth", month);
        model.addAttribute("yearList", yearList);
        model.addAttribute("monthList", monthList);
        model.addAttribute("logHistoryList", logHistoryList);
        return "./loghistory/log-history";
    }
}