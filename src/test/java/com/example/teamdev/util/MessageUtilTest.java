package com.example.teamdev.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;

import java.util.Locale;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MessageUtilTest {

    @Mock
    private MessageSource messageSource;

    @BeforeEach
    void setUp() {
        new MessageUtil(messageSource);
        LocaleContextHolder.setLocale(Locale.JAPAN);
    }

    @Test
    void getMessage_shouldReturnLocalizedMessage() {
        String expectedMessage = "テストメッセージ";
        when(messageSource.getMessage(eq("test.message"), eq(null), any(Locale.class)))
                .thenReturn(expectedMessage);

        String actualMessage = MessageUtil.getMessage("test.message");

        assertEquals(expectedMessage, actualMessage);
    }

    @Test
    void getMessage_shouldReturnMessageWithArgs() {
        String expectedMessage = "こんにちは、Testさん";
        when(messageSource.getMessage(eq("greeting.message"), eq(new Object[]{"Test"}), any(Locale.class)))
                .thenReturn(expectedMessage);

        String actualMessage = MessageUtil.getMessage("greeting.message", new Object[]{"Test"});

        assertEquals(expectedMessage, actualMessage);
    }

    @Test
    void getMessageJa_shouldReturnJapaneseMessage() {
        String expectedMessage = "日本語メッセージ";
        when(messageSource.getMessage(eq("test.message"), eq(null), eq(Locale.JAPAN)))
                .thenReturn(expectedMessage);

        String actualMessage = MessageUtil.getMessageJa("test.message");

        assertEquals(expectedMessage, actualMessage);
    }

    @Test
    void getMessageEn_shouldReturnEnglishMessage() {
        String expectedMessage = "English Message";
        when(messageSource.getMessage(eq("test.message"), eq(null), eq(Locale.ENGLISH)))
                .thenReturn(expectedMessage);

        String actualMessage = MessageUtil.getMessageEn("test.message");

        assertEquals(expectedMessage, actualMessage);
    }

    @Test
    void getMessage_shouldReturnKey_whenMessageNotFound() {
        String messageKey = "non.existent.key";
        when(messageSource.getMessage(eq(messageKey), eq(null), any(Locale.class)))
                .thenThrow(new RuntimeException("Message not found"));

        String actualMessage = MessageUtil.getMessage(messageKey);

        assertEquals(messageKey, actualMessage);
    }
}