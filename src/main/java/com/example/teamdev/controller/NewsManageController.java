package com.example.teamdev.controller;

import com.example.teamdev.dto.DataTablesRequest;
import com.example.teamdev.dto.DataTablesResponse;
import com.example.teamdev.form.ListForm;
import com.example.teamdev.form.NewsManageForm;
import com.example.teamdev.service.NewsManageDeletionService;
import com.example.teamdev.service.NewsManageRegistrationService;
import com.example.teamdev.service.NewsManageReleaseService;
import com.example.teamdev.service.NewsManageService;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("newsmanage")
public class NewsManageController {

    private static final Logger logger = LoggerFactory.getLogger(NewsManageController.class);

    private final NewsManageService newsManageService;
    private final NewsManageRegistrationService newsManageRegistrationService;
    private final NewsManageReleaseService newsManageReleaseService;
    private final NewsManageDeletionService newsManageDeletionService;

    @Autowired
    public NewsManageController(NewsManageService newsManageService, NewsManageRegistrationService newsManageRegistrationService, NewsManageReleaseService newsManageReleaseService, NewsManageDeletionService newsManageDeletionService) {
        this.newsManageService = newsManageService;
        this.newsManageRegistrationService = newsManageRegistrationService;
        this.newsManageReleaseService = newsManageReleaseService;
        this.newsManageDeletionService = newsManageDeletionService;
    }

    @PostMapping("init")
    public String initPost(Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        return view(model, session, redirectAttributes);
    }

    @GetMapping("init")
    public String initGet(Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        return view(model, session, redirectAttributes);
    }

    @PostMapping("regist")
    public String regist(@Validated NewsManageForm newsManageForm, BindingResult bindingResult, Model model, RedirectAttributes redirectAttributes, HttpSession session) {
        if (bindingResult.hasErrors()) {
            for (FieldError error : bindingResult.getFieldErrors()) {
                logger.warn("Validation error - Field: {}, Error: {}", error.getField(), error.getDefaultMessage());
            }
            model.addAttribute("registResult", "入力内容にエラーがあります。修正してください。");
            return view(model, session, redirectAttributes);
        }

        try {
            Integer updateEmployeeId = SpringSecurityModelUtil.getCurrentEmployeeId(model, redirectAttributes);
            if (updateEmployeeId == null) {
                return view(model, session, redirectAttributes);
            }
            newsManageRegistrationService.execute(newsManageForm, updateEmployeeId);
            redirectAttributes.addFlashAttribute("registResult", "登録しました");
            return "redirect:/newsmanage/init";
        } catch (Exception e) {
            logger.error("Exception occurred during registration", e);
            return "error";
        }
    }

    @PostMapping("release")
    public String release(ListForm listForm, Model model, RedirectAttributes redirectAttributes, HttpSession session) {
        try {
            Integer updateEmployeeId = SpringSecurityModelUtil.getCurrentEmployeeId(model, redirectAttributes);
            if (updateEmployeeId == null) {
                return "redirect:/newsmanage/init";
            }
            newsManageReleaseService.execute(listForm, updateEmployeeId);
            redirectAttributes.addFlashAttribute("releaseResult", "公開しました");
            return "redirect:/newsmanage/init";
        } catch (Exception e) {
            logger.error("Exception occurred during release", e);
            return "error";
        }
    }

    @PostMapping("delete")
    public String delete(ListForm listForm, Model model, RedirectAttributes redirectAttributes, HttpSession session) {
        try {
            Integer updateEmployeeId = SpringSecurityModelUtil.getCurrentEmployeeId(model, redirectAttributes);
            if (updateEmployeeId == null) {
                return "redirect:/newsmanage/init";
            }
            newsManageDeletionService.execute(listForm, updateEmployeeId);
            redirectAttributes.addFlashAttribute("deleteResult", "削除しました");
            return "redirect:/newsmanage/init";
        } catch (Exception e) {
            logger.error("Exception occurred during deletion", e);
            return "error";
        }
    }

    @PostMapping("data")
    @ResponseBody
    public DataTablesResponse<Map<String, Object>> getNewsData(@RequestBody DataTablesRequest request) {
        try {
            return newsManageService.getNewsForDataTables(request);
        } catch (Exception e) {
            logger.error("Exception occurred while fetching news data for DataTables", e);
            return new DataTablesResponse<>();
        }
    }

    private String view(Model model, HttpSession session, RedirectAttributes redirectAttributes) {
        try {
            String navRedirect = SpringSecurityModelUtil.setNavigation(model, redirectAttributes);
            if (navRedirect != null) {
                return navRedirect;
            }

            List<Map<String, Object>> newsList = newsManageService.execute();
            model.addAttribute("newsList", newsList);

            return "./newsmanage/news-manage";
        } catch (Exception e) {
            logger.error("Exception occurred in view", e);
            return "error";
        }
    }
}
