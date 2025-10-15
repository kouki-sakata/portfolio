package com.example.teamdev.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;
import org.springframework.util.StringUtils;

import java.util.function.Supplier;

/**
 * ケースインセンシティブな CSRF トークンリクエストハンドラー
 * HTTPヘッダー名の大文字小文字を無視してCSRFトークンを取得します
 */
public class CaseInsensitiveCsrfTokenRequestHandler implements CsrfTokenRequestHandler {

    private final CsrfTokenRequestHandler delegate = new XorCsrfTokenRequestAttributeHandler();

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, Supplier<CsrfToken> csrfToken) {
        delegate.handle(request, response, csrfToken);
    }

    @Override
    public String resolveCsrfTokenValue(HttpServletRequest request, CsrfToken csrfToken) {
        // まずリクエストヘッダーからトークンを取得（ケースインセンシティブ）
        String tokenValue = getTokenFromHeaders(request, csrfToken.getHeaderName());

        if (StringUtils.hasText(tokenValue)) {
            return tokenValue;
        }

        // ヘッダーになければ、パラメータから取得（デフォルトの動作）
        return request.getParameter(csrfToken.getParameterName());
    }

    /**
     * HTTPヘッダーからCSRFトークンを取得（ケースインセンシティブ）
     *
     * @param request HTTPリクエスト
     * @param headerName 期待されるヘッダー名（例: "X-XSRF-TOKEN"）
     * @return トークン値、見つからない場合はnull
     */
    private String getTokenFromHeaders(HttpServletRequest request, String headerName) {
        // まず、完全一致で試す（パフォーマンス最適化）
        String tokenValue = request.getHeader(headerName);
        if (StringUtils.hasText(tokenValue)) {
            return tokenValue;
        }

        // 完全一致しない場合、すべてのヘッダーをケースインセンシティブに検索
        var headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String currentHeaderName = headerNames.nextElement();
            if (currentHeaderName.equalsIgnoreCase(headerName)) {
                tokenValue = request.getHeader(currentHeaderName);
                if (StringUtils.hasText(tokenValue)) {
                    return tokenValue;
                }
            }
        }

        return null;
    }
}
