# TeamDev 勤怠管理システム - セキュリティ監査レポート

**作成日:** 2025年1月27日  
**監査対象:** TeamDevelopBravo プロジェクト  
**監査範囲:** 全ソースコード、設定ファイル、依存関係

## 📊 **エグゼクティブサマリー**

本セキュリティ監査では、TeamDev勤怠管理システムにおいて**10件の潜在的な脆弱性および問題
**を特定しました。その中でも特に、**SQLインジェクション脆弱性**
は即座に対応が必要な緊急度の高い問題として分類されます。

### 🔴 **リスクレベル分布**

- **高リスク（緊急）:** 3件
- **中リスク:** 4件
- **低リスク:** 3件

---

## 🚨 **高リスク（緊急対応必要）**

### 1. SQLインジェクション脆弱性 【緊急】

**ファイル:**
`src/main/resources/com/example/teamdev/mapper/EmployeeMapper.xml`  
**行番号:** 51  
**深刻度:** ⭐⭐⭐⭐⭐ (最高)

#### 問題の詳細

```xml

<if test="orderColumn != null and orderColumn != ''">
    ORDER BY ${orderColumn} ${orderDir}
</if>
```

DataTablesからの並び順指定パラメータが直接SQL文に埋め込まれており、SQLインジェクション攻撃が可能です。

#### 攻撃シナリオ例

```json
{
  "order": [
    {
      "column": 0,
      "dir": "asc; DROP TABLE employee; --"
    }
  ],
  "columns": [
    {
      "data": "id; UPDATE employee SET admin_flag=1; --"
    }
  ]
}
```

#### 修正方法

```java
// EmployeeService.javaでホワイトリスト検証を追加
private static final Set<String> ALLOWED_COLUMNS = Set.of("id", "first_name",
                "last_name", "email", "admin_flag");
private static final Set<String> ALLOWED_DIRECTIONS = Set.of("asc", "desc");

public DataTablesResponse getEmployeesForDataTables(DataTablesRequest request) {
    // カラム名の検証
    if (!ALLOWED_COLUMNS.contains(orderColumn)) {
        orderColumn = "id"; // デフォルト値
    }
    // ソート方向の検証
    if (!ALLOWED_DIRECTIONS.contains(orderDir.toLowerCase())) {
        orderDir = "asc"; // デフォルト値
    }
    // ...
}
```

---

### 2. パスワード更新時のバリデーション問題

**ファイル:** `src/main/java/com/example/teamdev/form/EmployeeManageForm.java`  
**行番号:** 43-45  
**深刻度:** ⭐⭐⭐⭐

#### 問題の詳細

従業員情報更新時でも、パスワードフィールドに`@NotBlank`
が適用されており、パスワードを変更しない更新操作でもパスワード入力が必須になってしまいます。

```java

@Size(min = 8, max = 16)
@Pattern(regexp = "^[a-zA-Z0-9]+$")
@NotBlank  // ← この制約が更新時にも適用される
private String password;
```

#### 修正方法

```java
// バリデーショングループを使用した条件分岐
public interface CreateGroup {
}

public interface UpdateGroup {
}

@Size(min = 8, max = 16, groups = {CreateGroup.class, UpdateGroup.class})
@Pattern(regexp = "^[a-zA-Z0-9]+$", groups = {CreateGroup.class, UpdateGroup.class})
@NotBlank(groups = CreateGroup.class)  // 新規作成時のみ必須
private String password;
```

---

### 3. トランザクション管理の欠如

**ファイル:**
`src/main/java/com/example/teamdev/service/NewsManageReleaseService.java`  
**行番号:** 26  
**深刻度:** ⭐⭐⭐

#### 問題の詳細

複数のデータベース更新処理を行っているにも関わらず、`@Transactional`
アノテーションが設定されていません。

```java
public void execute(ListForm listForm, Integer updateEmployeeId) {
    // 複数のDB更新処理があるがトランザクション管理なし
    for (Map<String, String> editMap : listForm.getEditList()) {
        // ... mapper.upDate(entity); 
    }
    // ... logHistoryService.execute(...);
}
```

#### 修正方法

```java

@Transactional
public void execute(ListForm listForm, Integer updateEmployeeId) {
    // 既存の処理
}
```

---

## 🔶 **中リスク**

### 4. 管理者権限チェックの不足

**ファイル:** Controller層全般  
**深刻度:** ⭐⭐⭐

#### 問題の詳細

URLレベルでの認可設定はありますが、メソッドレベルでの詳細な権限チェックが不足しています。

#### 修正方法

```java

@PreAuthorize("hasRole('ADMIN')")
@PostMapping("/data")
public DataTablesResponse getEmployeeData(
        @RequestBody DataTablesRequest request) {
    // ...
}
```

---

### 5. DataTablesリクエストの入力検証不足

**ファイル:** `src/main/java/com/example/teamdev/dto/DataTablesRequest.java`  
**深刻度:** ⭐⭐⭐

#### 問題の詳細

DataTablesからのリクエストに対する入力検証が不足しており、不正なパラメータによる予期しない動作の可能性があります。

#### 修正方法

```java

@Data
public class DataTablesRequest {
    @Min(0)
    private int draw;

    @Min(0)
    private int start;

    @Min(1)
    @Max(100)
    private int length;

    @Valid
    private Search search;

    @Valid
    private List<Order> order;

    @Valid
    private List<Column> columns;
}
```

---

### 6. セッション管理の非一貫性

**ファイル:** Controller層全般  
**深刻度:** ⭐⭐

#### 問題の詳細

複数のコントローラで重複したセッションチェック処理が実装されており、一貫性とメンテナンス性に問題があります。

#### 修正方法

```java

@Aspect
@Component
public class SessionValidationAspect {
    @Around("@annotation(SessionRequired)")
    public Object validateSession(ProceedingJoinPoint joinPoint)
            throws Throwable {
        // 統一されたセッション検証ロジック
    }
}
```

---

### 7. Content Security Policy (CSP) 未実装

**ファイル:** `src/main/resources/templates/common/body_end_fragment.html`  
**深刻度:** ⭐⭐

#### 問題の詳細

外部CDNリソースを使用しているにも関わらず、CSPヘッダーが設定されていません。

```html

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
<script src="https://cdn.datatables.net/1.13.7/js/jquery.dataTables.min.js"></script>
```

#### 修正方法

```java
// SecurityConfig.javaに追加
.headers(headers ->headers
        .

contentSecurityPolicy("default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://ajax.googleapis.com https://cdn.datatables.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.datatables.net")
)
```

---

## 🔵 **低リスク**

### 8. NumberFormatException の未処理

**ファイル:** 複数のController  
**深刻度:** ⭐⭐

#### 問題の詳細

`Integer.parseInt`を使用している箇所で、不正な文字列が渡された場合の例外処理が不十分です。

#### 修正方法

```java
// Utilityクラスでの安全な変換メソッド
public static Optional<Integer> safeParseInt(String value) {
    try {
        return Optional.of(Integer.parseInt(value));
    } catch (NumberFormatException e) {
        return Optional.empty();
    }
}
```

---

### 9. メモリリークの可能性

**ファイル:** `src/main/java/com/example/teamdev/service/EmployeeService.java`  
**行番号:** 35  
**深刻度:** ⭐

#### 問題の詳細

`ConcurrentHashMap`を使用したキャッシュ機能でサイズ制限がないため、長期運用でメモリリークの可能性があります。

```java
private final Map<String, List<Employee>> employeeCache = new ConcurrentHashMap<>();
```

#### 修正方法

```java
// Caffeine等のキャッシュライブラリの使用を推奨
@Cacheable(value = "employees", key = "#adminFlag")
public List<Employee> getAllEmployees(Integer adminFlag) {
    // ...
}
```

---

### 10. ログレベルの本番環境対策

**ファイル:** 各種設定ファイル  
**深刻度:** ⭐

#### 問題の詳細

開発時のデバッグ情報が本番環境で出力される可能性があります。

#### 修正方法

```properties
# application-prod.properties
logging.level.com.example.teamdev=WARN
logging.level.org.springframework.security=WARN
```

---

## 📋 **推奨対応順序**

### Phase 1: 緊急対応（1週間以内）

1. SQLインジェクション脆弱性の修正
2. パスワードバリデーション問題の修正
3. トランザクション管理の追加

### Phase 2: セキュリティ強化（2週間以内）

4. 管理者権限チェックの強化
5. 入力検証の追加
6. CSPヘッダーの実装

### Phase 3: 品質向上（1ヶ月以内）

7. セッション管理の統一化
8. 例外処理の改善
9. メモリリーク対策
10. ログレベルの最適化

---

## 🛠 **追加推奨事項**

### セキュリティテストの導入

```bash
# 静的コード解析
./gradlew dependencyCheckAnalyze

# セキュリティテスト
./gradlew test --tests "*SecurityTest"
```

### 継続的セキュリティ監視

- 依存関係の脆弱性定期チェック
- セキュリティヘッダーの監視
- ログ監視とアラート設定

### 開発者教育

- セキュアコーディングガイドラインの策定
- OWASP Top 10の周知
- コードレビューでのセキュリティチェック

---

## 📞 **連絡先**

このレポートに関するご質問やフォローアップが必要な場合は、開発チームまでお問い合わせください。

**監査実施者:** Claude Code Assistant  
**レポート作成日:** 2025年1月27日  
**次回監査予定:** 修正完了後の再監査を推奨
