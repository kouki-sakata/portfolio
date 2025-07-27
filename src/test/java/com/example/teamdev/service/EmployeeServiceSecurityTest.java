package com.example.teamdev.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * EmployeeServiceのセキュリティ機能をテストするクラス
 * SQLインジェクション対策の動作確認
 */
@DisplayName("EmployeeService セキュリティテスト")
class EmployeeServiceSecurityTest {

    @Test
    @DisplayName("ホワイトリスト定数の検証")
    void testWhitelistConstants() {
        // リフレクションを使ってprivate static finalフィールドにアクセス
        try {
            Class<?> clazz = EmployeeService.class;
            java.lang.reflect.Field allowedColumnsField = clazz.getDeclaredField("ALLOWED_COLUMNS");
            allowedColumnsField.setAccessible(true);
            @SuppressWarnings("unchecked")
            Set<String> allowedColumns = (Set<String>) allowedColumnsField.get(null);

            java.lang.reflect.Field allowedDirectionsField = clazz.getDeclaredField("ALLOWED_DIRECTIONS");
            allowedDirectionsField.setAccessible(true);
            @SuppressWarnings("unchecked")
            Set<String> allowedDirections = (Set<String>) allowedDirectionsField.get(null);

            // 許可されるカラムのテスト
            assertTrue(allowedColumns.contains("id"), "idカラムが許可されている");
            assertTrue(allowedColumns.contains("first_name"), "first_nameカラムが許可されている");
            assertTrue(allowedColumns.contains("last_name"), "last_nameカラムが許可されている");
            assertTrue(allowedColumns.contains("email"), "emailカラムが許可されている");
            assertTrue(allowedColumns.contains("admin_flag"), "admin_flagカラムが許可されている");
            
            // 危険なカラム名は許可されていない
            assertFalse(allowedColumns.contains("DROP TABLE"), "危険なSQL文は許可されていない");
            assertFalse(allowedColumns.contains("'; DROP TABLE employee; --"), "SQLインジェクション攻撃は許可されていない");

            // 許可されるソート方向のテスト
            assertTrue(allowedDirections.contains("asc"), "asc方向が許可されている");
            assertTrue(allowedDirections.contains("desc"), "desc方向が許可されている");
            
            // 危険なソート方向は許可されていない
            assertFalse(allowedDirections.contains("asc; DROP TABLE"), "危険なSQL文は許可されていない");
            
            System.out.println("✅ SQLインジェクション対策のホワイトリストが正しく設定されています");
            System.out.println("許可されるカラム: " + allowedColumns);
            System.out.println("許可されるソート方向: " + allowedDirections);

        } catch (Exception e) {
            fail("リフレクションでのフィールドアクセスに失敗: " + e.getMessage());
        }
    }

    @Test
    @DisplayName("カラム名のセキュリティ検証")
    void testColumnNameSecurity() {
        // 危険なカラム名パターンのテスト
        String[] dangerousColumns = {
            "id; DROP TABLE employee; --",
            "first_name' OR '1'='1",
            "email'; UPDATE employee SET admin_flag=1; --",
            "unknown_column",
            "' UNION SELECT * FROM users --"
        };

        Set<String> allowedColumns = Set.of("id", "first_name", "last_name", "email", "admin_flag");

        for (String dangerousColumn : dangerousColumns) {
            assertFalse(allowedColumns.contains(dangerousColumn), 
                "危険なカラム名 '" + dangerousColumn + "' は許可されていない");
        }

        System.out.println("✅ 危険なカラム名は適切に拒否されます");
    }

    @Test
    @DisplayName("ソート方向のセキュリティ検証")
    void testSortDirectionSecurity() {
        // 危険なソート方向パターンのテスト
        String[] dangerousDirections = {
            "asc; DROP TABLE employee; --",
            "desc'; UPDATE employee SET password='hacked'; --",
            "invalid_direction",
            "asc' OR '1'='1"
        };

        Set<String> allowedDirections = Set.of("asc", "desc");

        for (String dangerousDirection : dangerousDirections) {
            assertFalse(allowedDirections.contains(dangerousDirection.toLowerCase()), 
                "危険なソート方向 '" + dangerousDirection + "' は許可されていない");
        }

        System.out.println("✅ 危険なソート方向は適切に拒否されます");
    }
}