package com.example.teamdev.controller;

import com.example.teamdev.form.SignInForm;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ui.Model;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import jakarta.servlet.http.HttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@Disabled("Legacy MVC controller")
@ExtendWith(MockitoExtension.class)
class SignInControllerTest {

    @Mock
    private Model model;

    @Mock
    private RedirectAttributes redirectAttributes;

    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private SignInController signInController;

    @Test
    void getInit_shouldReturnSignInView() {
        String result = signInController.getInit(model, null, null);

        assertEquals("./signin/signin", result);
        verify(model, times(1)).addAttribute(eq("form"), org.mockito.ArgumentMatchers.any(SignInForm.class));
    }

    @Test
    void getInit_shouldShowErrorMessage_whenErrorParamIsPresent() {
        String result = signInController.getInit(model, "true", null);

        assertEquals("./signin/signin", result);
        verify(model, times(1)).addAttribute(eq("error"), anyString());
    }

    @Test
    void getInit_shouldShowLogoutMessage_whenLogoutParamIsPresent() {
        String result = signInController.getInit(model, null, "true");

        assertEquals("./signin/signin", result);
        verify(model, times(1)).addAttribute(eq("message"), anyString());
    }
}