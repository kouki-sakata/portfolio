package com.example.teamdev.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;

/**
 * リクエスト処理中に発生した例外を標準出力へロギングするフィルター。
 * 例外は再スローし、従来どおり Spring の例外ハンドリングへ委譲する。
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class ExceptionLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(ExceptionLoggingFilter.class);

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            filterChain.doFilter(request, response);
        } catch (ResponseStatusException ex) {
            log.warn(
                "Handled ResponseStatusException: status={}, reason={}, method={}, uri={}",
                ex.getStatusCode(),
                ex.getReason(),
                request.getMethod(),
                request.getRequestURI()
            );
            throw ex;
        } catch (Exception ex) {
            log.error(
                "Unhandled exception at method={} uri={}: {}",
                request.getMethod(),
                request.getRequestURI(),
                ex.getMessage(),
                ex
            );
            throw ex;
        }
    }
}
