package com.example.teamdev.security;

import com.example.teamdev.controller.EmployeeManageController;
import com.example.teamdev.controller.NewsManageController;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;

/**
 * メソッドレベルセキュリティの実装をテストするクラス
 * @PreAuthorize アノテーションの適用状況を確認
 */
@DisplayName("メソッドレベルセキュリティテスト")
class MethodSecurityTest {

    @Test
    @DisplayName("EmployeeManageController - 管理者権限チェックが適用されている")
    void testEmployeeManageControllerMethodSecurity() {
        Class<?> controllerClass = EmployeeManageController.class;
        
        // getEmployeeDataメソッドの権限チェック
        assertMethodHasPreAuthorize(controllerClass, "getEmployeeData", 
                "DataTables取得メソッドに管理者権限チェックが適用されている");
        
        // registメソッドの権限チェック
        assertMethodHasPreAuthorize(controllerClass, "regist",
                "従業員登録メソッドに管理者権限チェックが適用されている");
        
        // deleteメソッドの権限チェック
        assertMethodHasPreAuthorize(controllerClass, "delete",
                "従業員削除メソッドに管理者権限チェックが適用されている");
        
        System.out.println("✅ EmployeeManageController の全メソッドに適切な権限チェックが適用されています");
    }

    @Test
    @DisplayName("NewsManageController - 管理者権限チェックが適用されている")
    void testNewsManageControllerMethodSecurity() {
        Class<?> controllerClass = NewsManageController.class;
        
        // getNewsDataメソッドの権限チェック
        assertMethodHasPreAuthorize(controllerClass, "getNewsData",
                "ニュースDataTables取得メソッドに管理者権限チェックが適用されている");
        
        // registメソッドの権限チェック
        assertMethodHasPreAuthorize(controllerClass, "regist",
                "ニュース登録メソッドに管理者権限チェックが適用されている");
        
        // releaseメソッドの権限チェック
        assertMethodHasPreAuthorize(controllerClass, "release",
                "ニュース公開メソッドに管理者権限チェックが適用されている");
        
        // deleteメソッドの権限チェック
        assertMethodHasPreAuthorize(controllerClass, "delete",
                "ニュース削除メソッドに管理者権限チェックが適用されている");
        
        System.out.println("✅ NewsManageController の全メソッドに適切な権限チェックが適用されています");
    }

    @Test
    @DisplayName("@PreAuthorize アノテーションの設定値が正しい")
    void testPreAuthorizeAnnotationValues() {
        Class<?> employeeControllerClass = EmployeeManageController.class;
        Class<?> newsControllerClass = NewsManageController.class;
        
        // EmployeeManageController のメソッドチェック
        assertPreAuthorizeValue(employeeControllerClass, "getEmployeeData", "hasRole('ADMIN')");
        assertPreAuthorizeValue(employeeControllerClass, "regist", "hasRole('ADMIN')");
        assertPreAuthorizeValue(employeeControllerClass, "delete", "hasRole('ADMIN')");
        
        // NewsManageController のメソッドチェック
        assertPreAuthorizeValue(newsControllerClass, "getNewsData", "hasRole('ADMIN')");
        assertPreAuthorizeValue(newsControllerClass, "regist", "hasRole('ADMIN')");
        assertPreAuthorizeValue(newsControllerClass, "release", "hasRole('ADMIN')");
        assertPreAuthorizeValue(newsControllerClass, "delete", "hasRole('ADMIN')");
        
        System.out.println("✅ 全ての @PreAuthorize アノテーションで正しいロール設定が確認されました");
    }

    @Test
    @DisplayName("メソッドレベルセキュリティ設定の網羅性チェック")
    void testSecurityCoverage() {
        // 重要な管理機能を持つメソッドの一覧
        String[] criticalMethods = {
            "getEmployeeData", "regist", "delete",  // Employee管理
            "getNewsData", "release"                // News管理
        };
        
        int securedMethodsCount = 0;
        
        // EmployeeManageController のカバレッジ
        Class<?> employeeController = EmployeeManageController.class;
        for (Method method : employeeController.getDeclaredMethods()) {
            if (method.isAnnotationPresent(PreAuthorize.class)) {
                securedMethodsCount++;
                System.out.println("セキュア化済み: " + employeeController.getSimpleName() + "." + method.getName());
            }
        }
        
        // NewsManageController のカバレッジ
        Class<?> newsController = NewsManageController.class;
        for (Method method : newsController.getDeclaredMethods()) {
            if (method.isAnnotationPresent(PreAuthorize.class)) {
                securedMethodsCount++;
                System.out.println("セキュア化済み: " + newsController.getSimpleName() + "." + method.getName());
            }
        }
        
        // 最低限のセキュリティ要件を満たしているかチェック
        assertTrue(securedMethodsCount >= 7, 
            "重要な管理機能メソッドの最低7つ以上にセキュリティが適用されている");
        
        System.out.println("✅ " + securedMethodsCount + "個のメソッドがセキュア化されています");
    }

    /**
     * 指定されたメソッドに @PreAuthorize アノテーションが適用されているかチェック
     */
    private void assertMethodHasPreAuthorize(Class<?> clazz, String methodName, String message) {
        try {
            Method[] methods = clazz.getDeclaredMethods();
            boolean found = false;
            
            for (Method method : methods) {
                if (method.getName().equals(methodName) && method.isAnnotationPresent(PreAuthorize.class)) {
                    found = true;
                    break;
                }
            }
            
            assertTrue(found, message + " - メソッド: " + methodName);
        } catch (Exception e) {
            fail("メソッド検索中にエラーが発生しました: " + e.getMessage());
        }
    }

    /**
     * @PreAuthorize アノテーションの値が期待通りかチェック
     */
    private void assertPreAuthorizeValue(Class<?> clazz, String methodName, String expectedValue) {
        try {
            Method[] methods = clazz.getDeclaredMethods();
            
            for (Method method : methods) {
                if (method.getName().equals(methodName) && method.isAnnotationPresent(PreAuthorize.class)) {
                    PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);
                    assertEquals(expectedValue, annotation.value(), 
                        "メソッド " + methodName + " の @PreAuthorize 値が正しい");
                    return;
                }
            }
            
            fail("メソッド " + methodName + " に @PreAuthorize アノテーションが見つかりません");
        } catch (Exception e) {
            fail("アノテーション検証中にエラーが発生しました: " + e.getMessage());
        }
    }
}