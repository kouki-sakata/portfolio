package com.example.teamdev.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.DeferredCsrfToken;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * CSRFトークンをレスポンスヘッダーに含めるフィルター
 * クロスオリジン環境では、フロントエンドがクッキーから直接CSRFトークンを読み取れないため、
 * レスポンスヘッダー経由でCSRFトークンを提供する
 */
public class CsrfHeaderFilter extends OncePerRequestFilter {

    private static final String CSRF_HEADER_NAME = "X-XSRF-TOKEN";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Spring Security stores the token lazily (DeferredCsrfToken) until it is accessed.
        // Resolve the actual token to ensure both the cookie and header are issued.
        CsrfToken csrfToken = resolveToken(request);

        // Add CSRF token to response header if it exists
        // Use explicit header name to ensure CORS compatibility (must match setExposedHeaders)
        if (csrfToken != null) {
            response.setHeader(CSRF_HEADER_NAME, csrfToken.getToken());
        }

        filterChain.doFilter(request, response);
    }

    private CsrfToken resolveToken(HttpServletRequest request) {
        Object attribute = request.getAttribute(CsrfToken.class.getName());
        if (attribute == null) {
            attribute = request.getAttribute("_csrf");
        }

        CsrfToken csrfToken = null;
        if (attribute instanceof CsrfToken token) {
            csrfToken = token;
        } else if (attribute instanceof DeferredCsrfToken deferred) {
            csrfToken = deferred.get();
        }

        if (csrfToken != null) {
            // Preserve both attribute keys so downstream components see the resolved token
            request.setAttribute(CsrfToken.class.getName(), csrfToken);
            request.setAttribute("_csrf", csrfToken);
        }

        return csrfToken;
    }
}
