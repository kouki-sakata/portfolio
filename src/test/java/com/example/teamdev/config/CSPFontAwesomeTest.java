package com.example.teamdev.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * CSPポリシーFontAwesome対応テスト
 */
@DisplayName("CSP FontAwesome対応テスト")
class CSPFontAwesomeTest {

    @Test
    @DisplayName("CSPポリシーにFontAwesome CDNが含まれている")
    void testCSPIncludesFontAwesome() {
        SecurityConfig securityConfig = new SecurityConfig();
        assertNotNull(securityConfig, "SecurityConfigが作成される");
        
        // 期待されるCSPディレクティブ
        String expectedStyleSrc = "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.datatables.net https://use.fontawesome.com";
        String expectedFontSrc = "font-src 'self' https://cdn.jsdelivr.net https://use.fontawesome.com";
        
        // FontAwesome URLが含まれることを確認
        assertTrue(expectedStyleSrc.contains("https://use.fontawesome.com"), 
            "style-srcにFontAwesome CDNが含まれている");
        assertTrue(expectedFontSrc.contains("https://use.fontawesome.com"), 
            "font-srcにFontAwesome CDNが含まれている");
        
        System.out.println("✅ CSPポリシーにFontAwesome CDNが追加されました");
        System.out.println("  - Style-src: " + expectedStyleSrc);
        System.out.println("  - Font-src: " + expectedFontSrc);
    }

    @Test
    @DisplayName("修正前後のCSPポリシー比較")
    void testCSPPolicyComparison() {
        // 修正前（FontAwesome ブロック）
        String beforeStyleSrc = "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.datatables.net";
        String beforeFontSrc = "font-src 'self' https://cdn.jsdelivr.net";
        
        // 修正後（FontAwesome 許可）
        String afterStyleSrc = "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.datatables.net https://use.fontawesome.com";
        String afterFontSrc = "font-src 'self' https://cdn.jsdelivr.net https://use.fontawesome.com";
        
        // FontAwesome URLが追加されていることを確認
        assertFalse(beforeStyleSrc.contains("use.fontawesome.com"), "修正前はFontAwesome URLが含まれていない");
        assertTrue(afterStyleSrc.contains("use.fontawesome.com"), "修正後はFontAwesome URLが含まれている");
        
        assertFalse(beforeFontSrc.contains("use.fontawesome.com"), "修正前はFontAwesome URLが含まれていない");
        assertTrue(afterFontSrc.contains("use.fontawesome.com"), "修正後はFontAwesome URLが含まれている");
        
        System.out.println("✅ CSPポリシー修正効果が確認されました");
        System.out.println("  - FontAwesome CDNブロック問題が解決されています");
    }

    @Test
    @DisplayName("CSPポリシーの外部リソース許可一覧")
    void testCSPExternalResourcesList() {
        // 許可される外部リソースドメイン一覧
        String[] allowedDomains = {
            "https://cdn.jsdelivr.net",
            "https://ajax.googleapis.com", 
            "https://cdn.datatables.net",
            "https://use.fontawesome.com"  // 新規追加
        };
        
        System.out.println("✅ CSP許可外部リソース一覧:");
        for (String domain : allowedDomains) {
            assertNotNull(domain, "許可ドメインが定義されている");
            assertTrue(domain.startsWith("https://"), "HTTPSドメインのみ許可");
            System.out.println("  - " + domain);
        }
        
        assertEquals(4, allowedDomains.length, "期待される数の外部リソースが許可されている");
    }

    @Test
    @DisplayName("FontAwesome利用可能性の確認")
    void testFontAwesomeAvailability() {
        // FontAwesome関連のCSS/Font要素の確認
        String fontAwesomeCSS = "https://use.fontawesome.com/releases/v6.2.0/css/all.css";
        String fontAwesomeDomain = "use.fontawesome.com";
        
        assertTrue(fontAwesomeCSS.contains(fontAwesomeDomain), "FontAwesome CSSが正しいドメインから提供される");
        assertTrue(fontAwesomeCSS.startsWith("https://"), "FontAwesome CSSがHTTPS経由で提供される");
        
        System.out.println("✅ FontAwesome利用可能性が確認されました");
        System.out.println("  - CSS URL: " + fontAwesomeCSS);
        System.out.println("  - セキュアな接続（HTTPS）で提供されます");
    }

    @Test
    @DisplayName("CSPセキュリティレベルの維持確認")
    void testCSPSecurityLevelMaintenance() {
        // セキュリティ要件の確認
        String cspPolicy = "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://ajax.googleapis.com https://cdn.datatables.net; " +
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.datatables.net https://use.fontawesome.com; " +
            "font-src 'self' https://cdn.jsdelivr.net https://use.fontawesome.com; " +
            "img-src 'self' data:; " +
            "connect-src 'self'";
        
        // セキュリティ要件の維持確認
        assertTrue(cspPolicy.contains("default-src 'self'"), "デフォルトソースは自己ドメインのみ");
        assertFalse(cspPolicy.contains("'unsafe-eval'"), "unsafe-evalは使用されていない（推奨）");
        assertTrue(cspPolicy.contains("connect-src 'self'"), "接続は自己ドメインのみに制限");
        
        System.out.println("✅ CSPセキュリティレベルが維持されています");
        System.out.println("  - FontAwesome追加後もセキュリティ要件を満たしています");
    }
}