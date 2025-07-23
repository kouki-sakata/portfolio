package com.example.teamdev.exception;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ValidationExceptionTest {

    @Test
    void constructor_shouldSetMessage() {
        String message = "Validation error occurred";
        ValidationException exception = new ValidationException(message);

        assertEquals(message, exception.getMessage());
        assertNull(exception.getFieldErrors());
    }

    @Test
    void constructor_shouldSetMessageAndFieldErrors() {
        String message = "Validation error occurred";
        Map<String, String> fieldErrors = new HashMap<>();
        fieldErrors.put("email", "Email is required");
        fieldErrors.put("password", "Password is too short");

        ValidationException exception = new ValidationException(message, fieldErrors);

        assertEquals(message, exception.getMessage());
        assertEquals(fieldErrors, exception.getFieldErrors());
        assertEquals("Email is required", exception.getFieldErrors().get("email"));
        assertEquals("Password is too short", exception.getFieldErrors().get("password"));
    }

    @Test
    void constructor_shouldSetMessageFieldErrorsAndCause() {
        String message = "Validation error occurred";
        Map<String, String> fieldErrors = new HashMap<>();
        fieldErrors.put("name", "Name is required");
        RuntimeException cause = new RuntimeException("Root cause");

        ValidationException exception = new ValidationException(message, fieldErrors, cause);

        assertEquals(message, exception.getMessage());
        assertEquals(cause, exception.getCause());
        assertEquals(fieldErrors, exception.getFieldErrors());
    }

    @Test
    void setFieldErrors_shouldUpdateFieldErrors() {
        ValidationException exception = new ValidationException("Test message");
        Map<String, String> newFieldErrors = new HashMap<>();
        newFieldErrors.put("field1", "Error 1");
        newFieldErrors.put("field2", "Error 2");

        exception.setFieldErrors(newFieldErrors);

        assertEquals(newFieldErrors, exception.getFieldErrors());
    }
}