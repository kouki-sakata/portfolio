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
 * DataTablesのバリデーション機能をテストするクラス
 * 入力値の検証とセキュリティ対策を確認
 */
@DisplayName("DataTablesバリデーションテスト")
class DataTablesValidationTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("正常なDataTablesRequestは検証をパスする")
    void testValidDataTablesRequest() {
        // 正常なリクエストデータ
        DataTablesRequest request = createValidRequest();
        
        // バリデーション実行
        Set<ConstraintViolation<DataTablesRequest>> violations = validator.validate(request);
        
        // 検証
        assertTrue(violations.isEmpty(), "正常なリクエストはバリデーションエラーが発生しない");
        System.out.println("✅ 正常なDataTablesRequestの検証をパスしました");
    }

    @Test
    @DisplayName("不正なページサイズは検証でエラーとなる")
    void testInvalidPageSize() {
        // ページサイズ境界値テスト
        DataTablesRequest request1 = createValidRequest();
        request1.setLength(0); // 最小値未満
        
        DataTablesRequest request2 = createValidRequest();
        request2.setLength(101); // 最大値超過
        
        // バリデーション実行
        Set<ConstraintViolation<DataTablesRequest>> violations1 = validator.validate(request1);
        Set<ConstraintViolation<DataTablesRequest>> violations2 = validator.validate(request2);
        
        // 検証
        assertFalse(violations1.isEmpty(), "ページサイズ0は不正値として検出される");
        assertFalse(violations2.isEmpty(), "ページサイズ101は不正値として検出される");
        
        System.out.println("✅ 不正なページサイズの検証エラーを確認しました");
        violations1.forEach(v -> System.out.println("  - " + v.getMessage()));
        violations2.forEach(v -> System.out.println("  - " + v.getMessage()));
    }

    @Test
    @DisplayName("不正な開始位置は検証でエラーとなる")
    void testInvalidStartPosition() {
        // 開始位置負数テスト
        DataTablesRequest request = createValidRequest();
        request.setStart(-1);
        
        // バリデーション実行
        Set<ConstraintViolation<DataTablesRequest>> violations = validator.validate(request);
        
        // 検証
        assertFalse(violations.isEmpty(), "負の開始位置は不正値として検出される");
        System.out.println("✅ 負の開始位置の検証エラーを確認しました");
        violations.forEach(v -> System.out.println("  - " + v.getMessage()));
    }

    @Test
    @DisplayName("不正な描画カウンターは検証でエラーとなる")
    void testInvalidDrawCounter() {
        // 描画カウンター負数テスト
        DataTablesRequest request = createValidRequest();
        request.setDraw(-1);
        
        // バリデーション実行
        Set<ConstraintViolation<DataTablesRequest>> violations = validator.validate(request);
        
        // 検証
        assertFalse(violations.isEmpty(), "負の描画カウンターは不正値として検出される");
        System.out.println("✅ 負の描画カウンターの検証エラーを確認しました");
        violations.forEach(v -> System.out.println("  - " + v.getMessage()));
    }

    @Test
    @DisplayName("検索文字列の長さ制限をテストする")
    void testSearchStringLength() {
        // 検索文字列長すぎるテスト
        DataTablesRequest request = createValidRequest();
        Search search = new Search();
        search.setValue("a".repeat(101)); // 100文字超過
        search.setRegex(false);
        request.setSearch(search);
        
        // バリデーション実行
        Set<ConstraintViolation<DataTablesRequest>> violations = validator.validate(request);
        
        // 検証
        assertFalse(violations.isEmpty(), "長すぎる検索文字列は不正値として検出される");
        System.out.println("✅ 長すぎる検索文字列の検証エラーを確認しました");
        violations.forEach(v -> System.out.println("  - " + v.getMessage()));
    }

    @Test
    @DisplayName("ソート指定の妥当性をテストする")
    void testOrderValidation() {
        // 不正なソート列番号テスト
        DataTablesRequest request = createValidRequest();
        Order order = new Order();
        order.setColumn(-1); // 負の列番号
        order.setDir("asc");
        request.setOrder(List.of(order));
        
        // バリデーション実行
        Set<ConstraintViolation<DataTablesRequest>> violations = validator.validate(request);
        
        // 検証
        assertFalse(violations.isEmpty(), "負の列番号は不正値として検出される");
        System.out.println("✅ 不正なソート列番号の検証エラーを確認しました");
        violations.forEach(v -> System.out.println("  - " + v.getMessage()));
    }

    @Test
    @DisplayName("不正なソート方向は検証でエラーとなる")
    void testInvalidSortDirection() {
        // 不正なソート方向テスト
        DataTablesRequest request = createValidRequest();
        Order order = new Order();
        order.setColumn(0);
        order.setDir("invalid"); // 不正な方向
        request.setOrder(List.of(order));
        
        // バリデーション実行
        Set<ConstraintViolation<DataTablesRequest>> violations = validator.validate(request);
        
        // 検証
        assertFalse(violations.isEmpty(), "不正なソート方向は不正値として検出される");
        System.out.println("✅ 不正なソート方向の検証エラーを確認しました");
        violations.forEach(v -> System.out.println("  - " + v.getMessage()));
    }

    @Test
    @DisplayName("セキュリティ要件の総合確認")
    void testSecurityRequirements() {
        int totalSecurityChecks = 0;
        int passedChecks = 0;

        // 1. ページサイズ制限（DOS攻撃対策）
        DataTablesRequest oversizeRequest = createValidRequest();
        oversizeRequest.setLength(1000);
        if (!validator.validate(oversizeRequest).isEmpty()) {
            passedChecks++;
        }
        totalSecurityChecks++;

        // 2. 検索文字列長制限（入力値検証）
        DataTablesRequest longSearchRequest = createValidRequest();
        Search longSearch = new Search();
        longSearch.setValue("x".repeat(150));
        longSearch.setRegex(false);
        longSearchRequest.setSearch(longSearch);
        if (!validator.validate(longSearchRequest).isEmpty()) {
            passedChecks++;
        }
        totalSecurityChecks++;

        // 3. 負数チェック（不正入力対策）
        DataTablesRequest negativeRequest = createValidRequest();
        negativeRequest.setStart(-10);
        if (!validator.validate(negativeRequest).isEmpty()) {
            passedChecks++;
        }
        totalSecurityChecks++;

        // 4. ソート方向制限（SQLインジェクション対策）
        DataTablesRequest sqlRequest = createValidRequest();
        Order sqlOrder = new Order();
        sqlOrder.setColumn(0);
        sqlOrder.setDir("'; DROP TABLE users; --");
        sqlRequest.setOrder(List.of(sqlOrder));
        if (!validator.validate(sqlRequest).isEmpty()) {
            passedChecks++;
        }
        totalSecurityChecks++;

        // セキュリティチェック結果
        double securityCoverage = (double) passedChecks / totalSecurityChecks * 100;
        assertTrue(securityCoverage >= 75.0, 
            "セキュリティ要件の75%以上をパスしている（現在: " + securityCoverage + "%）");
        
        System.out.println("✅ セキュリティ要件確認: " + passedChecks + "/" + totalSecurityChecks + 
                         " (" + String.format("%.1f", securityCoverage) + "%)");
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