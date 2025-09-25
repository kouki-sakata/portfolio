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
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
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
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;
import java.util.Map;

@Profile("legacy-ui")
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
    @PreAuthorize("hasRole('ADMIN')")
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
    @PreAuthorize("hasRole('ADMIN')")
    public String release(ListForm listForm, Model model, RedirectAttributes redirectAttributes, HttpSession session, HttpServletRequest request) {
        logger.debug("NewsManageController.release started");
        
        // リクエストパラメータをすべてログ出力
        logger.info("=== Request Parameters ===");
        request.getParameterMap().forEach((key, values) -> {
            logger.info("Parameter: {} = {}", key, java.util.Arrays.toString(values));
        });
        logger.info("=== End Request Parameters ===");
        
        logger.info("Release request received - ListForm: {}", listForm);
        if (listForm != null) {
            logger.info("ListForm.idList: {}", listForm.getIdList());
            logger.info("ListForm.editList: {}", listForm.getEditList());
            if (listForm.getEditList() != null) {
                logger.info("EditList size: {}", listForm.getEditList().size());
                for (int i = 0; i < listForm.getEditList().size(); i++) {
                    logger.info("EditList[{}]: {}", i, listForm.getEditList().get(i));
                }
            }
        }
        
        try {
            if (listForm == null) {
                logger.error("ListForm is null in release request");
                redirectAttributes.addFlashAttribute("releaseResult", "エラー: 無効なリクエストです");
                return "redirect:/newsmanage/init";
            }
            
            if (listForm.getEditList() == null || listForm.getEditList().isEmpty()) {
                logger.warn("EditList is null or empty in release request");
                redirectAttributes.addFlashAttribute("releaseResult", "エラー: 選択されたアイテムがありません");
                return "redirect:/newsmanage/init";
            }
            
            logger.debug("ListForm contains {} items", listForm.getEditList().size());
            
            Integer updateEmployeeId = SpringSecurityModelUtil.getCurrentEmployeeId(model, redirectAttributes);
            if (updateEmployeeId == null) {
                logger.error("updateEmployeeId is null");
                return "redirect:/newsmanage/init";
            }
            
            logger.info("Calling newsManageReleaseService.execute with updateEmployeeId: {}", updateEmployeeId);
            newsManageReleaseService.execute(listForm, updateEmployeeId);
            
            logger.info("Release operation completed successfully");
            redirectAttributes.addFlashAttribute("releaseResult", "公開しました");
            return "redirect:/newsmanage/init";
        } catch (Exception e) {
            logger.error("Exception occurred during release", e);
            redirectAttributes.addFlashAttribute("releaseResult", "エラーが発生しました: " + e.getMessage());
            return "redirect:/newsmanage/init";
        }
    }

    @PostMapping("delete")
    @PreAuthorize("hasRole('ADMIN')")
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
    @PreAuthorize("hasRole('ADMIN')")
    public DataTablesResponse<Map<String, Object>> getNewsData(@RequestBody DataTablesRequest request) {
        try {
            logger.info("Received DataTables request: draw={}, start={}, length={}", 
                request.getDraw(), request.getStart(), request.getLength());
            return newsManageService.getNewsForDataTables(request);
        } catch (Exception e) {
            logger.error("Exception occurred while fetching news data for DataTables", e);
            // エラー詳細情報を含むレスポンスを返す
            DataTablesResponse<Map<String, Object>> errorResponse = new DataTablesResponse<>();
            errorResponse.setDraw(request != null ? request.getDraw() : 1);
            errorResponse.setRecordsTotal(0);
            errorResponse.setRecordsFiltered(0);
            errorResponse.setError("データ取得エラー: " + e.getMessage());
            return errorResponse;
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
