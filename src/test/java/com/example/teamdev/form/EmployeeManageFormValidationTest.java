package com.example.teamdev.form;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * EmployeeManageFormのバリデーション機能をテストするクラス
 * パスワードバリデーション問題の修正確認
 */
@DisplayName("EmployeeManageForm バリデーションテスト")
class EmployeeManageFormValidationTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("バリデーショングループが正しく定義されている")
    void testValidationGroupsExist() {
        // バリデーショングループのインターフェースが存在することを確認
        assertTrue(EmployeeManageForm.CreateGroup.class.isInterface(), "CreateGroupインターフェースが存在する");
        assertTrue(EmployeeManageForm.UpdateGroup.class.isInterface(), "UpdateGroupインターフェースが存在する");
        
        System.out.println("✅ バリデーショングループが正しく定義されています");
    }

    @Test
    @DisplayName("新規作成時：パスワードが必須")
    void testPasswordRequiredForCreate() {
        EmployeeManageForm form = new EmployeeManageForm();
        form.setFirstName("太郎");
        form.setLastName("山田");
        form.setEmail("yamada@example.com");
        form.setAdminFlag("0");
        // パスワードを設定しない

        // CreateGroupでバリデーション
        Set<ConstraintViolation<EmployeeManageForm>> violations = 
            validator.validate(form, EmployeeManageForm.CreateGroup.class);

        // デバッグ用：エラーメッセージを出力
        violations.forEach(v -> {
            System.out.println("Property: " + v.getPropertyPath() + ", Message: " + v.getMessage());
        });

        // パスワード必須エラーが発生することを確認
        boolean hasPasswordError = violations.stream()
            .anyMatch(v -> v.getPropertyPath().toString().equals("password"));
        
        assertTrue(hasPasswordError, "新規作成時はパスワードが必須");
        
        System.out.println("✅ 新規作成時はパスワードが必須として検証されます");
    }

    @Test
    @DisplayName("新規作成時：パスワードありで正常")
    void testPasswordProvidedForCreate() {
        EmployeeManageForm form = new EmployeeManageForm();
        form.setFirstName("太郎");
        form.setLastName("山田");
        form.setEmail("yamada@example.com");
        form.setPassword("password123");
        form.setAdminFlag("0");

        // CreateGroupでバリデーション
        Set<ConstraintViolation<EmployeeManageForm>> violations = 
            validator.validate(form, EmployeeManageForm.CreateGroup.class);

        // パスワード関連のエラーがないことを確認
        assertFalse(violations.stream()
            .anyMatch(v -> v.getPropertyPath().toString().equals("password")),
            "有効なパスワードが設定されている場合はエラーなし");
        
        System.out.println("✅ 新規作成時に有効なパスワードがあれば正常に検証されます");
    }

    @Test
    @DisplayName("更新時：パスワードは任意")
    void testPasswordOptionalForUpdate() {
        EmployeeManageForm form = new EmployeeManageForm();
        form.setEmployeeId("1");
        form.setFirstName("太郎");
        form.setLastName("山田");
        form.setEmail("yamada@example.com");
        form.setAdminFlag("0");
        // パスワードを設定しない

        // UpdateGroupでバリデーション
        Set<ConstraintViolation<EmployeeManageForm>> violations = 
            validator.validate(form, EmployeeManageForm.UpdateGroup.class);

        // パスワード必須エラーが発生しないことを確認
        assertFalse(violations.stream()
            .anyMatch(v -> v.getPropertyPath().toString().equals("password") && 
                          v.getMessage().contains("空要素は許可されていません")),
            "更新時はパスワードは任意");
        
        System.out.println("✅ 更新時はパスワードが任意として検証されます");
    }

    @Test
    @DisplayName("更新時：パスワードありでも正常")
    void testPasswordProvidedForUpdate() {
        EmployeeManageForm form = new EmployeeManageForm();
        form.setEmployeeId("1");
        form.setFirstName("太郎");
        form.setLastName("山田");
        form.setEmail("yamada@example.com");
        form.setPassword("newpassword123");
        form.setAdminFlag("0");

        // UpdateGroupでバリデーション
        Set<ConstraintViolation<EmployeeManageForm>> violations = 
            validator.validate(form, EmployeeManageForm.UpdateGroup.class);

        // パスワード関連のエラーがないことを確認
        assertFalse(violations.stream()
            .anyMatch(v -> v.getPropertyPath().toString().equals("password")),
            "有効なパスワードが設定されている場合はエラーなし");
        
        System.out.println("✅ 更新時にパスワードがあっても正常に検証されます");
    }

    @Test
    @DisplayName("パスワード形式バリデーション")
    void testPasswordFormatValidation() {
        EmployeeManageForm form = new EmployeeManageForm();
        form.setFirstName("太郎");
        form.setLastName("山田");
        form.setEmail("yamada@example.com");
        form.setAdminFlag("0");

        // 無効なパスワード（短すぎる）
        form.setPassword("short");
        Set<ConstraintViolation<EmployeeManageForm>> violations = 
            validator.validate(form, EmployeeManageForm.CreateGroup.class);
        
        assertTrue(violations.stream()
            .anyMatch(v -> v.getPropertyPath().toString().equals("password")),
            "短すぎるパスワードは無効");

        // 無効なパスワード（特殊文字含む）
        form.setPassword("password@123");
        violations = validator.validate(form, EmployeeManageForm.CreateGroup.class);
        
        assertTrue(violations.stream()
            .anyMatch(v -> v.getPropertyPath().toString().equals("password")),
            "特殊文字を含むパスワードは無効");

        // 有効なパスワード
        form.setPassword("password123");
        violations = validator.validate(form, EmployeeManageForm.CreateGroup.class);
        
        assertFalse(violations.stream()
            .anyMatch(v -> v.getPropertyPath().toString().equals("password")),
            "有効なパスワード形式");
        
        System.out.println("✅ パスワード形式バリデーションが正常に動作します");
    }
}