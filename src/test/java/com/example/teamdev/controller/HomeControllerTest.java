package com.example.teamdev.controller;

import com.example.teamdev.constant.AppConstants;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.form.HomeForm;
import com.example.teamdev.service.HomeNewsService;
import com.example.teamdev.service.StampService;
import com.example.teamdev.util.SecurityUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import jakarta.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HomeControllerTest {

    @Mock
    private HomeNewsService homeNewsService;

    @Mock
    private StampService stampService;

    @Mock
    private Model model;

    @Mock
    private HttpSession session;

    @Mock
    private RedirectAttributes redirectAttributes;

    @Mock
    private BindingResult bindingResult;

    @InjectMocks
    private HomeController homeController;

    private HomeForm homeForm;
    private Map<String, Object> newsItem;

    @BeforeEach
    void setUp() {
        homeForm = new HomeForm();
        homeForm.setStampType(AppConstants.Stamp.TYPE_ATTENDANCE);
        homeForm.setStampTime("2025-07-21T09:00:00");
        homeForm.setNightWorkFlag(AppConstants.Stamp.NIGHT_WORK_FLAG_OFF);

        newsItem = new HashMap<>();
        newsItem.put("id", 1);
        newsItem.put("title", "Test News");
        newsItem.put("content", "Test Content");
    }

    @Test
    void init_shouldReturnViewMethod() {
        when(homeNewsService.execute()).thenReturn(List.of(newsItem));

        String result = homeController.init(model, session, redirectAttributes);

        assertEquals("./home/home", result);
        verify(homeNewsService, times(1)).execute();
    }

    @Test
    void initGet_shouldReturnViewMethod() {
        when(homeNewsService.execute()).thenReturn(List.of(newsItem));

        String result = homeController.initGet(model, session, redirectAttributes);

        assertEquals("./home/home", result);
        verify(homeNewsService, times(1)).execute();
    }

    @Test
    void regist_shouldReturnRedirectWhenValidationFails() {
        when(bindingResult.hasErrors()).thenReturn(true);

        String result = homeController.regist(homeForm, bindingResult, model, redirectAttributes, session);

        assertEquals("redirect:/home/init", result);
        verify(redirectAttributes, times(1)).addFlashAttribute(eq("result"), anyString());
        verify(stampService, never()).execute(any(HomeForm.class), anyInt());
    }

    @Test
    void regist_shouldProcessStampWhenValidationPasses() {
        when(bindingResult.hasErrors()).thenReturn(false);
        
        try (MockedStatic<SecurityUtil> securityUtil = mockStatic(SecurityUtil.class)) {
            securityUtil.when(SecurityUtil::getCurrentEmployeeId).thenReturn(1);

            String result = homeController.regist(homeForm, bindingResult, model, redirectAttributes, session);

            assertEquals("redirect:/home/init", result);
            verify(stampService, times(1)).execute(homeForm, 1);
            verify(redirectAttributes, times(1)).addFlashAttribute(eq("result"), anyString());
        }
    }

    @Test
    void regist_shouldReturnRedirectWhenEmployeeIdIsNull() {
        when(bindingResult.hasErrors()).thenReturn(false);
        
        try (MockedStatic<SecurityUtil> securityUtil = mockStatic(SecurityUtil.class)) {
            securityUtil.when(SecurityUtil::getCurrentEmployeeId).thenReturn(null);

            String result = homeController.regist(homeForm, bindingResult, model, redirectAttributes, session);

            assertEquals("redirect:/home/init", result);
            verify(redirectAttributes, times(1)).addFlashAttribute(eq("result"), anyString());
            verify(stampService, never()).execute(any(HomeForm.class), anyInt());
        }
    }
}