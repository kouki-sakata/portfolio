package com.example.teamdev.aspect;

import com.example.teamdev.annotation.SessionRequired;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.Signature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.util.Collection;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * SessionValidationAspectのテストクラス
 * AOPによるセッション管理機能の動作を確認
 */
@DisplayName("AOPセッション管理テスト")
class SessionValidationAspectTest {

    private SessionValidationAspect sessionValidationAspect;

    @Mock
    private ProceedingJoinPoint joinPoint;

    @Mock
    private SessionRequired sessionRequired;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpSession session;

    @Mock
    private Authentication authentication;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Signature signature;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        sessionValidationAspect = new SessionValidationAspect();
        
        // 基本的なモック設定
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("testMethod");
        when(sessionRequired.redirectUrl()).thenReturn("/signin");
        when(sessionRequired.requireAdmin()).thenReturn(false);
    }

    @Test
    @DisplayName("正常なセッションとユーザー認証でメソッドが実行される")
    void testValidSessionAndAuthentication() throws Throwable {
        // セッション管理の設定
        setupValidSession();
        setupValidAuthentication(false);
        
        // メソッド実行の期待値設定
        String expectedResult = "success";
        when(joinPoint.proceed()).thenReturn(expectedResult);
        
        // テスト実行
        Object result = sessionValidationAspect.validateSession(joinPoint, sessionRequired);
        
        // 検証
        assertEquals(expectedResult, result, "正常なセッションでメソッドが実行される");
        verify(joinPoint, times(1)).proceed();
        
        System.out.println("✅ 正常なセッションとユーザー認証でメソッドが実行されました");
    }

    @Test
    @DisplayName("セッションが存在しない場合はリダイレクトされる")
    void testNoSessionRedirect() throws Throwable {
        // セッションなしの設定
        setupNoSession();
        
        // テスト実行
        Object result = sessionValidationAspect.validateSession(joinPoint, sessionRequired);
        
        // 検証
        assertEquals("redirect:/signin", result, "セッションがない場合はリダイレクトされる");
        verify(joinPoint, never()).proceed();
        
        System.out.println("✅ セッションが存在しない場合のリダイレクトが確認されました");
    }

    @Test
    @DisplayName("未認証ユーザーはリダイレクトされる")
    void testUnauthenticatedUserRedirect() throws Throwable {
        // セッション有りだが未認証の設定
        setupValidSession();
        setupUnauthenticatedUser();
        
        // テスト実行
        Object result = sessionValidationAspect.validateSession(joinPoint, sessionRequired);
        
        // 検証
        assertEquals("redirect:/signin", result, "未認証ユーザーはリダイレクトされる");
        verify(joinPoint, never()).proceed();
        
        System.out.println("✅ 未認証ユーザーのリダイレクトが確認されました");
    }

    @Test
    @DisplayName("管理者権限が必要な機能で一般ユーザーはアクセス拒否される")
    void testAdminRequiredAccessDenied() throws Throwable {
        // 管理者権限が必要な設定
        when(sessionRequired.requireAdmin()).thenReturn(true);
        
        // 一般ユーザーの設定
        setupValidSession();
        setupValidAuthentication(false); // 管理者権限なし
        
        // テスト実行
        Object result = sessionValidationAspect.validateSession(joinPoint, sessionRequired);
        
        // 検証
        assertEquals("redirect:/access-denied", result, "管理者権限がない場合はアクセス拒否される");
        verify(joinPoint, never()).proceed();
        
        System.out.println("✅ 管理者権限が必要な機能で一般ユーザーのアクセス拒否が確認されました");
    }

    @Test
    @DisplayName("管理者権限があるユーザーは管理機能にアクセスできる")
    void testAdminUserCanAccessAdminFeatures() throws Throwable {
        // 管理者権限が必要な設定
        when(sessionRequired.requireAdmin()).thenReturn(true);
        
        // 管理者ユーザーの設定
        setupValidSession();
        setupValidAuthentication(true); // 管理者権限あり
        
        // メソッド実行の期待値設定
        String expectedResult = "admin-success";
        when(joinPoint.proceed()).thenReturn(expectedResult);
        
        // テスト実行
        Object result = sessionValidationAspect.validateSession(joinPoint, sessionRequired);
        
        // 検証
        assertEquals(expectedResult, result, "管理者権限があるユーザーは管理機能にアクセスできる");
        verify(joinPoint, times(1)).proceed();
        
        System.out.println("✅ 管理者権限があるユーザーの管理機能アクセスが確認されました");
    }

    @Test
    @DisplayName("無効なセッションはリダイレクトされる")
    void testInvalidSessionRedirect() throws Throwable {
        // 無効なセッションの設定
        setupInvalidSession();
        setupValidAuthentication(false);
        
        // テスト実行
        Object result = sessionValidationAspect.validateSession(joinPoint, sessionRequired);
        
        // 検証
        assertEquals("redirect:/signin", result, "無効なセッションはリダイレクトされる");
        verify(joinPoint, never()).proceed();
        
        System.out.println("✅ 無効なセッションのリダイレクトが確認されました");
    }

    @Test
    @DisplayName("リクエスト属性が取得できない場合はリダイレクトされる")
    void testNoRequestAttributesRedirect() throws Throwable {
        // リクエスト属性なしの設定
        RequestContextHolder.setRequestAttributes(null);
        
        // テスト実行
        Object result = sessionValidationAspect.validateSession(joinPoint, sessionRequired);
        
        // 検証
        assertEquals("redirect:/signin", result, "リクエスト属性がない場合はリダイレクトされる");
        verify(joinPoint, never()).proceed();
        
        System.out.println("✅ リクエスト属性が取得できない場合のリダイレクトが確認されました");
    }

    @Test
    @DisplayName("AOPアスペクトの総合セキュリティチェック")
    void testComprehensiveSecurityCheck() throws Throwable {
        int securityChecks = 0;
        int passedChecks = 0;
        
        // 1. セッション存在チェック
        securityChecks++;
        setupNoSession();
        Object result1 = sessionValidationAspect.validateSession(joinPoint, sessionRequired);
        if (result1.toString().startsWith("redirect:")) {
            passedChecks++;
        }
        
        // 2. 認証チェック
        securityChecks++;
        setupValidSession();
        setupUnauthenticatedUser();
        Object result2 = sessionValidationAspect.validateSession(joinPoint, sessionRequired);
        if (result2.toString().startsWith("redirect:")) {
            passedChecks++;
        }
        
        // 3. 権限チェック
        securityChecks++;
        when(sessionRequired.requireAdmin()).thenReturn(true);
        setupValidAuthentication(false); // 一般ユーザー
        Object result3 = sessionValidationAspect.validateSession(joinPoint, sessionRequired);
        if (result3.toString().startsWith("redirect:")) {
            passedChecks++;
        }
        
        // セキュリティチェック結果
        double securityCoverage = (double) passedChecks / securityChecks * 100;
        assertTrue(securityCoverage >= 80.0, 
            "セキュリティチェックの80%以上をパスしている（現在: " + securityCoverage + "%）");
        
        System.out.println("✅ AOPセキュリティチェック: " + passedChecks + "/" + securityChecks + 
                         " (" + String.format("%.1f", securityCoverage) + "%)");
    }

    /**
     * 正常なセッション設定のヘルパーメソッド
     */
    private void setupValidSession() {
        ServletRequestAttributes attributes = mock(ServletRequestAttributes.class);
        when(attributes.getRequest()).thenReturn(request);
        when(request.getSession(false)).thenReturn(session);
        when(session.getLastAccessedTime()).thenReturn(System.currentTimeMillis());
        RequestContextHolder.setRequestAttributes(attributes);
    }

    /**
     * セッションなし設定のヘルパーメソッド
     */
    private void setupNoSession() {
        ServletRequestAttributes attributes = mock(ServletRequestAttributes.class);
        when(attributes.getRequest()).thenReturn(request);
        when(request.getSession(false)).thenReturn(null);
        RequestContextHolder.setRequestAttributes(attributes);
    }

    /**
     * 無効なセッション設定のヘルパーメソッド
     */
    private void setupInvalidSession() {
        ServletRequestAttributes attributes = mock(ServletRequestAttributes.class);
        when(attributes.getRequest()).thenReturn(request);
        when(request.getSession(false)).thenReturn(session);
        when(session.getLastAccessedTime()).thenThrow(new IllegalStateException("Invalid session"));
        RequestContextHolder.setRequestAttributes(attributes);
    }

    /**
     * 正常な認証設定のヘルパーメソッド
     */
    private void setupValidAuthentication(boolean isAdmin) {
        Collection<GrantedAuthority> authorities;
        if (isAdmin) {
            authorities = List.of(
                new SimpleGrantedAuthority("ROLE_USER"),
                new SimpleGrantedAuthority("ROLE_ADMIN")
            );
        } else {
            authorities = List.of(new SimpleGrantedAuthority("ROLE_USER"));
        }
        
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn("testuser@example.com");
        when(authentication.getName()).thenReturn("testuser@example.com");
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    /**
     * 未認証ユーザー設定のヘルパーメソッド
     */
    private void setupUnauthenticatedUser() {
        when(securityContext.getAuthentication()).thenReturn(null);
        SecurityContextHolder.setContext(securityContext);
    }
}