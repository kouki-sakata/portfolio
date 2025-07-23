package com.example.teamdev.exception;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class BusinessExceptionTest {

    @Test
    void constructor_shouldSetMessage() {
        String message = "Business error occurred";
        BusinessException exception = new BusinessException(message);

        assertEquals(message, exception.getMessage());
        assertNull(exception.getMessageKey());
        assertNull(exception.getMessageArgs());
    }

    @Test
    void constructor_shouldSetMessageAndCause() {
        String message = "Business error occurred";
        RuntimeException cause = new RuntimeException("Root cause");
        BusinessException exception = new BusinessException(message, cause);

        assertEquals(message, exception.getMessage());
        assertEquals(cause, exception.getCause());
        assertNull(exception.getMessageKey());
        assertNull(exception.getMessageArgs());
    }

    @Test
    void constructor_shouldSetMessageKeyAndArgs() {
        String messageKey = "business.error";
        Object[] messageArgs = {"arg1", "arg2"};
        BusinessException exception = new BusinessException(messageKey, messageArgs);

        assertEquals(messageKey, exception.getMessage());
        assertEquals(messageKey, exception.getMessageKey());
        assertArrayEquals(messageArgs, exception.getMessageArgs());
    }

    @Test
    void constructor_shouldSetMessageKeyArgsAndCause() {
        String messageKey = "business.error";
        Object[] messageArgs = {"arg1", "arg2"};
        RuntimeException cause = new RuntimeException("Root cause");
        BusinessException exception = new BusinessException(messageKey, messageArgs, cause);

        assertEquals(messageKey, exception.getMessage());
        assertEquals(cause, exception.getCause());
        assertEquals(messageKey, exception.getMessageKey());
        assertArrayEquals(messageArgs, exception.getMessageArgs());
    }
}