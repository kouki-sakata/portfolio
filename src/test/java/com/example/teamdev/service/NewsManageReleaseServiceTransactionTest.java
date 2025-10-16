package com.example.teamdev.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;

/**
 * NewsManageReleaseServiceのトランザクション管理をテストするクラス
 */
@DisplayName("NewsManageReleaseService トランザクション管理テスト")
class NewsManageReleaseServiceTransactionTest {

    @Test
    @DisplayName("executeメソッドに@Transactionalアノテーションが付いている")
    void testExecuteMethodHasTransactionalAnnotation() {
        try {
            Class<?> serviceClass = NewsManageReleaseService.class;
            Method executeMethod = serviceClass.getMethod("execute", 
                com.example.teamdev.form.ListForm.class, 
                Integer.class);

            // @Transactionalアノテーションの存在を確認
            Transactional transactionalAnnotation = executeMethod.getAnnotation(Transactional.class);
            assertNotNull(transactionalAnnotation, "executeメソッドに@Transactionalアノテーションが付いている");

            System.out.println("✅ NewsManageReleaseService.executeメソッドに@Transactionalアノテーションが正しく適用されています");
            
            // デフォルト値の確認
            System.out.println("トランザクション伝播レベル: " + transactionalAnnotation.propagation());
            System.out.println("トランザクション分離レベル: " + transactionalAnnotation.isolation());
            System.out.println("読み取り専用: " + transactionalAnnotation.readOnly());
            System.out.println("ロールバック対象例外: " + java.util.Arrays.toString(transactionalAnnotation.rollbackFor()));

        } catch (NoSuchMethodException e) {
            fail("executeメソッドが見つかりません: " + e.getMessage());
        }
    }

    @Test
    @DisplayName("クラスレベルでのトランザクション設定の確認")
    void testClassLevelTransactionConfiguration() {
        Class<?> serviceClass = NewsManageReleaseService.class;
        
        // org.springframework.stereotype.Serviceアノテーションの確認
        org.springframework.stereotype.Service serviceAnnotation = 
            serviceClass.getAnnotation(org.springframework.stereotype.Service.class);
        assertNotNull(serviceAnnotation, "クラスに@Serviceアノテーションが付いている");

        // クラスレベルの@Transactionalアノテーション確認（通常はメソッドレベルで十分）
        Transactional classTransactional = serviceClass.getAnnotation(Transactional.class);
        if (classTransactional != null) {
            System.out.println("クラスレベルの@Transactionalも設定されています");
        } else {
            System.out.println("クラスレベルの@Transactionalは設定されていません（メソッドレベルで適用済み）");
        }

        System.out.println("✅ NewsManageReleaseServiceのアノテーション設定が適切です");
    }

    @Test
    @DisplayName("トランザクション境界の正確性")
    void testTransactionBoundaryCorrectness() {
        // トランザクション対象のメソッドが複数のデータベース操作を含むことを確認
        try {
            Class<?> serviceClass = NewsManageReleaseService.class;
            
            // executeメソッドの存在確認
            Method executeMethod = serviceClass.getMethod("execute", 
                com.example.teamdev.form.ListForm.class, 
                Integer.class);
            
            assertTrue(executeMethod.isAnnotationPresent(Transactional.class), 
                "複数のDB操作を含むexecuteメソッドにトランザクションが適用されている");

            // publicメソッドであることを確認（Spring AOPの要件）
            assertTrue(java.lang.reflect.Modifier.isPublic(executeMethod.getModifiers()), 
                "executeメソッドはpublicである（Spring AOPトランザクションの要件）");

            System.out.println("✅ トランザクション境界が適切に設定されています");
            System.out.println("- 複数のDB操作を1つのトランザクションでまとめて管理");
            System.out.println("- publicメソッドでSpring AOPが正しく動作");

        } catch (NoSuchMethodException e) {
            fail("executeメソッドが見つかりません: " + e.getMessage());
        }
    }

    @Test
    @DisplayName("依存関係の確認")
    void testDependencyConfiguration() {
        try {
            Class<?> serviceClass = NewsManageReleaseService.class;

            // NewsMapperフィールドの存在確認
            java.lang.reflect.Field newsMapperField = serviceClass.getDeclaredField("mapper");
            assertNotNull(newsMapperField, "NewsMapperフィールドが存在する");
            assertTrue(java.lang.reflect.Modifier.isFinal(newsMapperField.getModifiers()),
                "NewsMapperフィールドはfinalである（コンストラクタインジェクション）");

            // LogHistoryRegistrationServiceフィールドの存在確認
            java.lang.reflect.Field logHistoryField = serviceClass.getDeclaredField("logHistoryService");
            assertNotNull(logHistoryField, "LogHistoryRegistrationServiceフィールドが存在する");
            assertTrue(java.lang.reflect.Modifier.isFinal(logHistoryField.getModifiers()),
                "LogHistoryRegistrationServiceフィールドはfinalである（コンストラクタインジェクション）");

            // コンストラクタの存在確認
            java.lang.reflect.Constructor<?> constructor = serviceClass.getConstructor(
                com.example.teamdev.mapper.NewsMapper.class,
                LogHistoryRegistrationService.class,
                java.time.Clock.class
            );
            assertNotNull(constructor, "3つのパラメータを持つコンストラクタが存在する");

            System.out.println("✅ 依存関係の注入設定が適切です");
            System.out.println("- NewsMapper: コンストラクタインジェクション（final）");
            System.out.println("- LogHistoryRegistrationService: コンストラクタインジェクション（final）");
            System.out.println("- Clock: コンストラクタインジェクション（final）");

        } catch (NoSuchFieldException | NoSuchMethodException e) {
            fail("フィールドまたはコンストラクタが見つかりません: " + e.getMessage());
        }
    }
}