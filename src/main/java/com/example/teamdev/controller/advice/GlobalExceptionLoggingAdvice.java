package com.example.teamdev.controller.advice;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.server.ResponseStatusException;

/**
 * 例外発生時にエラーログを標準出力へ流すためのグローバルハンドラー。
 * API レスポンスは従来どおり Spring に委譲するため、例外は再スローする。
 */
@RestControllerAdvice
public class GlobalExceptionLoggingAdvice {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionLoggingAdvice.class);

    @ExceptionHandler(ResponseStatusException.class)
    public void logResponseStatusException(ResponseStatusException ex, WebRequest request) throws ResponseStatusException {
        log.warn("Handled ResponseStatusException: status={}, reason={}, path={}",
            ex.getStatusCode(),
            ex.getReason(),
            request.getDescription(false));
        throw ex;
    }

    @ExceptionHandler(Exception.class)
    public void logUnhandledException(Exception ex, WebRequest request) throws Exception {
        log.error("Unhandled exception at {}: {}", request.getDescription(false), ex.getMessage(), ex);
        throw ex;
    }
}
