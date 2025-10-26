package com.example.teamdev.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * CSRFトークンをレスポンスヘッダーに含めるフィルター
 * クロスオリジン環境では、フロントエンドがクッキーから直接CSRFトークンを読み取れないため、
 * レスポンスヘッダー経由でCSRFトークンを提供する
 */
public class CsrfHeaderFilter extends OncePerRequestFilter {

    private static final String CSRF_COOKIE_NAME = "XSRF-TOKEN";
    private static final String CSRF_HEADER_NAME = "X-XSRF-TOKEN";

    private final boolean secureCookie;
    private final String sameSiteAttribute;
    private final boolean httpOnly;
    private final String cookiePath;

    public CsrfHeaderFilter(boolean secureCookie, String sameSiteAttribute, boolean httpOnly, String cookiePath) {
        this.secureCookie = secureCookie;
        this.sameSiteAttribute = sameSiteAttribute;
        this.httpOnly = httpOnly;
        this.cookiePath = cookiePath;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Get CSRF token from request attribute (set by Spring Security)
        CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());

        // Add CSRF token to response header if it exists
        // Use explicit header name to ensure CORS compatibility (must match setExposedHeaders)
        if (csrfToken != null) {
            response.setHeader(CSRF_HEADER_NAME, csrfToken.getToken());

            ResponseCookie.ResponseCookieBuilder cookieBuilder = ResponseCookie
                .from(CSRF_COOKIE_NAME, csrfToken.getToken())
                .httpOnly(httpOnly)
                .secure(secureCookie)
                .path(cookiePath);

            if (sameSiteAttribute != null && !sameSiteAttribute.isBlank()) {
                cookieBuilder.sameSite(sameSiteAttribute);
            }

            response.addHeader(HttpHeaders.SET_COOKIE, cookieBuilder.build().toString());
        }

        filterChain.doFilter(request, response);
    }
}
