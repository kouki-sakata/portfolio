# MyBatis リファクタリングプラン

## 問題と解決策

**問題:** `StampHistory.getEmployeeId()` が null → DELETE API で 500エラー

**根本原因:** `StampHistoryMapper` のアノテーション SQL が `SELECT *` を返しており、`employee_id` などを camelCase へエイリアスしていないため MyBatis が `employeeId` に値を詰められない。

**解決策:**
- **Phase 1（即効）:** `StampHistoryMapper` の `@Select` をフルカラム指定＋エイリアス化し、`employee_id AS employeeId` など明示マッピングで不具合を解消（実装済み）。
- **Phase 2-4（将来）:** エンティティを camelCase に統一し、最終的に `mapUnderscoreToCamelCase=true` を有効化できる状態へ移行。

---

## 1. 根本原因

### MyBatis マッピング失敗

```java
// StampHistoryMapper.java (修正前)
@Select("SELECT * FROM stamp_history WHERE id = #{id}")
Optional<StampHistory> getById(@Param("id") Integer id);
```

**問題:** `SELECT *` では `employee_id` → `employeeId` という暗黙変換が行われず、`StampHistory` の camelCase プロパティが `null` になる。

### 他エンティティが影響しない理由

| エンティティ | 理由 |
|------------|------|
| Employee | フィールド名を snake_case のまま保持しており、`SELECT *` でも一致 |
| LogHistory | 同上 |
| News | `@Results` で明示マッピング済み |
| StampHistory | camelCase フィールドのみ → **マッピング失敗** |

---

## 2. 現状評価

### エンティティ命名規則

| エンティティ | 命名 | 状態 | 動作 |
|------------|------|------|------|
| Employee | snake_case | ❌ 非標準 | ✅ 完全一致で動作 |
| LogHistory | snake_case | ❌ 非標準 | ✅ 完全一致で動作 |
| StampHistory | camelCase | ✅ 標準 | ❌ マッピング失敗 |
| News | camelCase | ✅ 標準 | ✅ @Results使用 |

### ベストプラクティス

- Java: camelCase（`employeeId`, `firstName`）
- DB: snake_case（`employee_id`, `first_name`）
- MyBatis: `mapUnderscoreToCamelCase=true`

---

## 3. 解決策

### Phase 1: 即効対応（完了）⭐

```java
// StampHistoryMapper.java (修正後抜粋)
@Select("SELECT id, year, month, day, employee_id AS employeeId, in_time AS inTime, "
        + "out_time AS outTime, update_employee_id AS updateEmployeeId, update_date AS updateDate "
        + "FROM stamp_history WHERE id = #{id}")
Optional<StampHistory> getById(@Param("id") Integer id);
```

**効果:** `StampHistory` 向け API の 500 エラーを即時解消。既存 snake_case エンティティへの影響はゼロ。

**検証:** `./gradlew test --tests "*StampHistory*"` 実行済み（2025-11-02）。

### Phase 2-4: エンティティ命名統一（将来）

- **Phase 2:** `Employee` / `LogHistory` / `LogHistoryDisplay` を camelCase プロパティへリネーム。
- **Phase 3:** サービス層・DTO・テストの getter/setter・Map キーを全て camelCase へ追随（約 18〜22 ファイル想定）。
- **Phase 4:** `mapUnderscoreToCamelCase=true` を `application*.properties` に適用、`@Results` の簡素化、総合テスト実施。

**前提:** OpenAPI / フロントは camelCase 前提のため、バックエンド完了後にフィールド整合が向上。

---

### Phase 1 実施記録

```bash
# 1. ブランチ作成
git checkout -b fix/stamp-history-alias

# 2. Mapper をエイリアス対応
vim src/main/java/com/example/teamdev/mapper/StampHistoryMapper.java

# 3. テスト実行
./gradlew test --tests "*StampHistory*"

# 4. 動作確認
# DELETE /api/stamps/{id} → 204 No Content
# GET /api/stamp-history → employeeId が正しく返却される

# 5. コミット
git add src/main/java/com/example/teamdev/mapper/StampHistoryMapper.java
git commit -m "fix: alias stamp history columns"
git push origin fix/stamp-history-alias
```

---

## 5. テスト計画

### 自動テスト
```bash
./gradlew test --tests "*StampHistory*"
./gradlew test --tests "*Employee*"
./gradlew integrationTest
./gradlew check
```

### 手動テスト

| テスト項目 | 期待結果 |
|----------|---------|
| DELETE `/api/stamps/{id}` | 204 No Content（エラー解消） |
| PUT `/api/stamps/{id}` | 正常更新 |
| GET `/api/stamp-history` | employeeId が null でない |
| Employee/News/LogHistory | 既存通り動作（snake_case 継続） |

---

## 6. 代替案（非推奨）

### 代替案 A: `mapUnderscoreToCamelCase` の即時有効化
- ❌ `Employee` / `LogHistory` など snake_case プロパティが多数残存しており、既存 API が崩壊するリスクが高い

### 代替案 B: 全 Mapper に `@Results` 追加
- ❌ 設定が肥大化し、保守コストが増大（本質的な命名不統一を解消できない）

### 採用案: フェーズド統一
- Phase 1 の局所エイリアスで障害を即時解消
- 後続フェーズで camelCase へ漸進リファクタリングし、最終的に `mapUnderscoreToCamelCase` を安全に併用

---

## 7. まとめ

### 即時フリーズポイント
**Phase 1:** `StampHistoryMapper` のエイリアス化（完了）
- 障害復旧・影響範囲極小
- 暫定対応である点を共有し、後続フェーズを計画

### 将来検討（推奨）
**Phase 2-4:** エンティティ camelCase 統一と `mapUnderscoreToCamelCase` 有効化
- 技術的負債の解消と OpenAPI／フロントとの整合性向上
- 作業規模は 18〜22 ファイル、400〜500 行程度を想定

### 専門家所見
- ✅ 局所エイリアスで障害を最小コストで解決
- 🟡 全面 camelCase 化は依存箇所が多く、中規模プロジェクトとして扱うべき
- 🔺 `mapUnderscoreToCamelCase` は統一作業完了後に適用する

---

**次のアクション:** Phase 2 以降の camelCase 統一を仕様化し、スプリント計画に組み込む
