package com.example.teamdev.aspect;

import com.example.teamdev.annotation.SessionRequired;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

/**
 * セッション検証のAOPアスペクト
 * @SessionRequired アノテーションが付与されたメソッドに対して統一的なセッション検証を実行
 */
@Aspect
@Component
public class SessionValidationAspect {

    private static final Logger logger = LoggerFactory.getLogger(SessionValidationAspect.class);

    /**
     * @SessionRequired アノテーションが付与されたメソッドの実行前後でセッション検証を行う
     *
     * @param joinPoint     実行対象のメソッド
     * @param sessionRequired セッション要件のアノテーション
     * @return メソッドの実行結果、またはリダイレクトパス
     */
    @Around("@annotation(sessionRequired)")
    public Object validateSession(ProceedingJoinPoint joinPoint, SessionRequired sessionRequired) 
            throws Throwable {
        
        // リクエスト情報を取得
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            logger.warn("リクエスト属性が取得できません");
            return "redirect:" + sessionRequired.redirectUrl();
        }

        HttpServletRequest request = attributes.getRequest();
        HttpSession session = request.getSession(false);

        // セッション存在チェック
        if (session == null) {
            logger.info("セッションが存在しません - Method: {}", joinPoint.getSignature().getName());
            return "redirect:" + sessionRequired.redirectUrl();
        }

        // Spring Security認証情報チェック
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || 
            "anonymousUser".equals(authentication.getPrincipal())) {
            logger.info("未認証ユーザーがアクセスしました - Method: {}", joinPoint.getSignature().getName());
            return "redirect:" + sessionRequired.redirectUrl();
        }

        // 管理者権限チェック（必要な場合）
        if (sessionRequired.requireAdmin()) {
            boolean hasAdminRole = authentication.getAuthorities().stream()
                    .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
            
            if (!hasAdminRole) {
                logger.warn("管理者権限が必要な機能に一般ユーザーがアクセスしました - User: {}, Method: {}", 
                           authentication.getName(), joinPoint.getSignature().getName());
                return "redirect:/access-denied";
            }
        }

        // セッション有効性チェック
        try {
            // セッションアクセスでタイムアウトチェック
            session.getLastAccessedTime();
            
            logger.debug("セッション検証成功 - User: {}, Method: {}", 
                        authentication.getName(), joinPoint.getSignature().getName());
            
            // 元のメソッドを実行
            return joinPoint.proceed();
            
        } catch (IllegalStateException e) {
            logger.info("セッションが無効です - Method: {}", joinPoint.getSignature().getName());
            return "redirect:" + sessionRequired.redirectUrl();
        }
    }
}