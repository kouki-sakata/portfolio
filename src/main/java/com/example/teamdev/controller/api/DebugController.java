package com.example.teamdev.controller.api;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

/**
 * デバッグ用コントローラー（開発環境・テスト環境のみ有効）
 * CSRF トークンの送受信を確認するためのエンドポイント
 */
@RestController
@RequestMapping("/api/debug")
@Profile({"dev", "test"})
public class DebugController {

    private static final Logger logger = LoggerFactory.getLogger(DebugController.class);

    /**
     * CSRF トークンのテスト用エンドポイント
     * リクエストヘッダーと Cookie の内容を返却
     */
    @PostMapping("/csrf-test")
    public ResponseEntity<Map<String, Object>> testCsrf(
            @RequestHeader(value = "X-XSRF-TOKEN", required = false) String csrfHeader,
            @CookieValue(value = "XSRF-TOKEN", required = false) String csrfCookie,
            HttpServletRequest request
    ) {
        logger.info("=== CSRF Test Endpoint Called ===");
        logger.info("X-XSRF-TOKEN Header: {}", csrfHeader);
        logger.info("XSRF-TOKEN Cookie: {}", csrfCookie);

        Map<String, Object> response = new HashMap<>();
        response.put("csrfHeader", csrfHeader);
        response.put("csrfCookie", csrfCookie);
        response.put("headersMatch", csrfHeader != null && csrfHeader.equals(csrfCookie));

        // 全てのリクエストヘッダーをログ出力
        Map<String, String> allHeaders = new HashMap<>();
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            String headerValue = request.getHeader(headerName);
            allHeaders.put(headerName, headerValue);
            logger.debug("Header: {} = {}", headerName, headerValue);
        }
        response.put("allHeaders", allHeaders);

        // Cookie情報をログ出力
        if (request.getCookies() != null) {
            Map<String, String> allCookies = new HashMap<>();
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                allCookies.put(cookie.getName(), cookie.getValue());
                logger.debug("Cookie: {} = {}", cookie.getName(), cookie.getValue());
            }
            response.put("allCookies", allCookies);
        }

        logger.info("=== CSRF Test Result ===");
        logger.info("Headers match: {}", response.get("headersMatch"));

        return ResponseEntity.ok(response);
    }

    /**
     * GET リクエストのテスト
     * CSRF トークンが不要なエンドポイント
     */
    @GetMapping("/test")
    public ResponseEntity<String> testGet() {
        logger.info("GET /api/debug/test called");
        return ResponseEntity.ok("Debug endpoint is working");
    }
}
