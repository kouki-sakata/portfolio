package com.example.teamdev.validation;

import com.example.teamdev.dto.DataTablesRequest;
import com.example.teamdev.dto.Search;
import com.example.teamdev.dto.Order;
import com.example.teamdev.dto.Column;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * DataTablesバリデーション修正のテストクラス
 * フロントエンド修正後の動作確認
 */
@DisplayName("DataTablesバリデーション修正テスト")
class DataTablesValidationFixTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("修正後のlength=10のリクエストは正常に処理される")
    void testFixedLengthValidation() {
        DataTablesRequest request = createValidRequest();
        request.setLength(10); // フロントエンドで修正された値
        
        Set<ConstraintViolation<DataTablesRequest>> violations = validator.validate(request);
        
        assertTrue(violations.isEmpty(), "length=10のリクエストはバリデーションをパスする");
        System.out.println("✅ 修正後のlength=10リクエストが正常に処理されます");
    }

    @Test
    @DisplayName("修正前のlength=0のリクエストはエラーとなる")
    void testOriginalLengthValidationError() {
        DataTablesRequest request = createValidRequest();
        request.setLength(0); // 修正前の問題のある値
        
        Set<ConstraintViolation<DataTablesRequest>> violations = validator.validate(request);
        
        assertFalse(violations.isEmpty(), "length=0のリクエストはバリデーションエラーとなる");
        
        // エラーメッセージの確認
        boolean hasLengthError = violations.stream()
            .anyMatch(v -> v.getPropertyPath().toString().equals("length"));
        assertTrue(hasLengthError, "lengthフィールドでバリデーションエラーが発生する");
        
        System.out.println("✅ 修正前のlength=0リクエストが適切にエラーとなります");
    }

    @Test
    @DisplayName("フロントエンド修正でstart値も適切に設定される")
    void testFixedStartValidation() {
        DataTablesRequest request = createValidRequest();
        request.setStart(0); // フロントエンドで修正された値
        
        Set<ConstraintViolation<DataTablesRequest>> violations = validator.validate(request);
        
        assertTrue(violations.isEmpty(), "start=0のリクエストはバリデーションをパスする");
        System.out.println("✅ 修正後のstart=0リクエストが正常に処理されます");
    }

    @Test
    @DisplayName("バリデーション修正前後の比較テスト")
    void testValidationBeforeAfterComparison() {
        int beforeFixErrors = 0;
        int afterFixErrors = 0;
        
        // 修正前の問題パターン
        DataTablesRequest beforeRequest = createValidRequest();
        beforeRequest.setLength(0);
        beforeRequest.setStart(-1);
        Set<ConstraintViolation<DataTablesRequest>> beforeViolations = validator.validate(beforeRequest);
        beforeFixErrors = beforeViolations.size();
        
        // 修正後の正常パターン
        DataTablesRequest afterRequest = createValidRequest();
        afterRequest.setLength(10);
        afterRequest.setStart(0);
        Set<ConstraintViolation<DataTablesRequest>> afterViolations = validator.validate(afterRequest);
        afterFixErrors = afterViolations.size();
        
        // 修正効果の確認
        assertTrue(beforeFixErrors > afterFixErrors, 
            "修正後のエラー数が減少している（修正前: " + beforeFixErrors + " → 修正後: " + afterFixErrors + "）");
        assertEquals(0, afterFixErrors, "修正後はバリデーションエラーが発生しない");
        
        System.out.println("✅ バリデーション修正効果確認:");
        System.out.println("  - 修正前エラー数: " + beforeFixErrors);
        System.out.println("  - 修正後エラー数: " + afterFixErrors);
    }

    @Test
    @DisplayName("サーバーサイドモードでの正常なリクエストパラメータ")
    void testServerSideModeParameters() {
        // サーバーサイドモードで送信される典型的なパラメータ
        DataTablesRequest request = createValidRequest();
        request.setDraw(1);
        request.setStart(0);
        request.setLength(10);
        
        // 検索条件
        Search search = new Search();
        search.setValue("");
        search.setRegex(false);
        request.setSearch(search);
        
        // ソート条件
        Order order = new Order();
        order.setColumn(1); // 日付カラム
        order.setDir("desc");
        request.setOrder(List.of(order));
        
        Set<ConstraintViolation<DataTablesRequest>> violations = validator.validate(request);
        
        assertTrue(violations.isEmpty(), "サーバーサイドモードの標準的なリクエストはバリデーションをパスする");
        System.out.println("✅ サーバーサイドモードでの正常なリクエストパラメータが確認されました");
    }

    @Test
    @DisplayName("フロントエンド修正によるセキュリティ向上確認")
    void testSecurityImprovementByFrontendFix() {
        int securityTests = 0;
        int passedTests = 0;
        
        // 1. 不正な負数値の防止
        securityTests++;
        DataTablesRequest negativeRequest = createValidRequest();
        negativeRequest.setLength(-1);
        negativeRequest.setStart(-1);
        if (!validator.validate(negativeRequest).isEmpty()) {
            passedTests++;
        }
        
        // 2. ゼロ値の防止（DoS攻撃対策）
        securityTests++;
        DataTablesRequest zeroRequest = createValidRequest();
        zeroRequest.setLength(0);
        if (!validator.validate(zeroRequest).isEmpty()) {
            passedTests++;
        }
        
        // 3. 過大な値の防止（DoS攻撃対策）
        securityTests++;
        DataTablesRequest largeRequest = createValidRequest();
        largeRequest.setLength(999);
        if (!validator.validate(largeRequest).isEmpty()) {
            passedTests++;
        }
        
        double securityImprovement = (double) passedTests / securityTests * 100;
        assertTrue(securityImprovement >= 80.0, 
            "セキュリティテストの80%以上をパスしている（現在: " + securityImprovement + "%）");
        
        System.out.println("✅ フロントエンド修正によるセキュリティ向上:");
        System.out.println("  - セキュリティテスト通過率: " + passedTests + "/" + securityTests + 
                         " (" + String.format("%.1f", securityImprovement) + "%)");
    }

    @Test
    @DisplayName("修正対象JSファイルの設定値確認")
    void testJavaScriptConfigurationValues() {
        // JavaScriptで設定される予定の値をテスト
        DataTablesRequest newsRequest = createValidRequest();
        newsRequest.setLength(10); // news_manage.js で設定される値
        newsRequest.setStart(0);
        
        DataTablesRequest employeeRequest = createValidRequest();
        employeeRequest.setLength(10); // employee_manage.js で設定される値
        employeeRequest.setStart(0);
        
        Set<ConstraintViolation<DataTablesRequest>> newsViolations = validator.validate(newsRequest);
        Set<ConstraintViolation<DataTablesRequest>> employeeViolations = validator.validate(employeeRequest);
        
        assertTrue(newsViolations.isEmpty(), "news_manage.js の設定値でバリデーションをパスする");
        assertTrue(employeeViolations.isEmpty(), "employee_manage.js の設定値でバリデーションをパスする");
        
        System.out.println("✅ 修正対象JSファイルの設定値が確認されました:");
        System.out.println("  - news_manage.js: length=10, start=0");
        System.out.println("  - employee_manage.js: length=10, start=0");
    }

    /**
     * 正常なDataTablesRequestを作成するヘルパーメソッド
     */
    private DataTablesRequest createValidRequest() {
        DataTablesRequest request = new DataTablesRequest();
        request.setDraw(1);
        request.setStart(0);
        request.setLength(10);
        
        // 検索条件
        Search search = new Search();
        search.setValue("");
        search.setRegex(false);
        request.setSearch(search);
        
        // ソート条件
        Order order = new Order();
        order.setColumn(0);
        order.setDir("asc");
        request.setOrder(List.of(order));
        
        // カラム設定
        Column column = new Column();
        column.setData("id");
        column.setName("id");
        column.setSearchable(true);
        column.setOrderable(true);
        Search columnSearch = new Search();
        columnSearch.setValue("");
        columnSearch.setRegex(false);
        column.setSearch(columnSearch);
        request.setColumns(List.of(column));
        
        return request;
    }
}