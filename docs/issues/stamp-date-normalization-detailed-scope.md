# `stamp_date` 正規化タスク - 詳細修正規模レポート

**調査日**: 2025-11-13
**調査対象**: 全層（バックエンド、フロントエンド、DB、テスト、ドキュメント）
**総ファイル数**: 76ファイル
**総修正行数**: 約600-750行

---

## 📊 エグゼクティブサマリー

### 現状
- **DB層**: `stamp_date` カラムは追加済み（V5マイグレーション完了）
- **同期トリガー**: `year/month/day` ⇄ `stamp_date` の双方向同期が稼働中
- **アプリケーション層**: **依然として `year/month/day` に完全依存**
- **進捗**: 約20%完了（DB層のみ）

### 移行規模
| カテゴリ | 影響ファイル数 | 修正行数 | 最高難易度 | 工数（人日） |
|---------|--------------|---------|-----------|------------|
| **バックエンド（本体）** | 27 | 250-320 | High | 2.0-2.5 |
| **バックエンド（テスト）** | 10 | 245-300 | High | 1.5-2.0 |
| **フロントエンド（本体）** | 14 | 100-130 | High | 1.5-2.0 |
| **フロントエンド（テスト）** | 5 | 30-35 | Medium | 0.5 |
| **DB/マイグレーション** | 5 | 50-60 | High | 0.5-1.0 |
| **ドキュメント** | 3 | 20-30 | Low | 0.3 |
| **合計** | **64** | **695-875** | **High** | **6.3-8.3** |

---

## 🎯 Phase 1: バックエンド内部の `stamp_date` 完全移行

### 1.1 エンティティ/DTO層（9ファイル）

#### 高優先度（3ファイル）

**StampHistory.java** `src/main/java/com/example/teamdev/entity/StampHistory.java`
- **修正内容**:
  ```java
  // 削除
  private String year;
  private String month;
  private String day;

  // 追加
  private LocalDate stampDate;
  ```
- **修正行数**: 6行
- **難易度**: **Medium**
- **影響範囲**: 30以上のファイルで参照
- **依存**: Mapper XML、全Service層、全Controller層

**StampHistoryDisplay.java** `src/main/java/com/example/teamdev/entity/StampHistoryDisplay.java`
- **修正内容**:
  - `stampDate` フィールド追加
  - CSV出力ロジック変更（3列 → 1列、または分解フォーマット）
  ```java
  // 変更前
  csvBuilder.append(year).append(",").append(month).append(",").append(day);

  // 変更後（オプション1: 統合）
  csvBuilder.append(stampDate != null ? stampDate.toString() : "");

  // 変更後（オプション2: 従来フォーマット維持）
  csvBuilder.append(stampDate.getYear()).append(",")
            .append(String.format("%02d", stampDate.getMonthValue())).append(",")
            .append(String.format("%02d", stampDate.getDayOfMonth()));
  ```
- **修正行数**: 8行
- **難易度**: **Medium**
- **注意**: CSV出力フォーマットの後方互換性を検討

**StampEditData.java** `src/main/java/com/example/teamdev/dto/StampEditData.java`
- **修正内容**:
  - Immutableクラスのため、コンストラクタ全面変更
  - year/month/day引数 → stampDate引数
  - getter 3つ削除、getter 1つ追加
- **修正行数**: 15行
- **難易度**: **Medium**
- **影響**: StampFormDataExtractor、StampHistoryPersistence、全テストケース

#### 中優先度（4ファイル）

**StampCreateRequest.java** / **StampHistoryEntryResponse.java**
- **修正行数**: 20行 / 4行
- **難易度**: **Low** (RecordクラスでシンプルなAPI定義)
- **API互換性**: ⚠️ **High Impact** - フロントエンドとの調整必須

**StampHistoryForm.java** / **StampOutputForm.java** / **StampEditForm.java**
- **修正行数**: 3行 / 3行 / 5行
- **難易度**: **Low to Medium**
- **注意**: StampEditFormのMap構造は動的なため慎重に

### 1.2 Mapper層（5ファイル）

#### 最重要（パフォーマンス直結）

**StampHistoryMapper.xml** `src/main/resources/com/example/teamdev/mapper/StampHistoryMapper.xml`

| クエリ名 | 行番号 | 現在のパフォーマンス問題 | 修正内容 | 効果 |
|---------|--------|---------------------|---------|------|
| `getStampHistoryByYearMonthEmployeeId` | 42-46 | 文字列3カラムJOIN | `gd.date = sh.stamp_date` | **大幅改善** |
| `selectDailyAttendance` | 158 | `TO_DATE(year\|\|month\|\|day)` | `sh.stamp_date = #{date}` | **大幅改善** |
| `findMonthlyStatistics` | 220-221 | `CONCAT(year,'-',month,'-01')` 複数回 | `stamp_date` 範囲クエリ | **大幅改善** |
| `save` / `update` | 119-148 | 3カラムINSERT/UPDATE | 1カラムINSERT/UPDATE | 改善 |

- **修正行数**: 20-25行
- **難易度**: **Medium to High**
- **パフォーマンス改善**: インデックス活用率が飛躍的に向上
  - 文字列連結操作削除
  - `idx_stamp_history_stamp_date (employee_id, stamp_date)` フル活用

**StampHistoryMapper.java**
- **修正内容**: メソッド名変更、シグネチャ変更
  ```java
  // 変更前
  StampHistory getStampHistoryByYearMonthDayEmployeeId(
      String year, String month, String day, int employee_id);

  // 変更後
  StampHistory getStampHistoryByStampDateEmployeeId(
      LocalDate stampDate, int employee_id);
  ```
- **修正行数**: 5-10行
- **難易度**: **Medium**

**StampDeleteMapper.xml**
- **修正内容**: 複雑なOR条件 → 単純な範囲クエリ
  ```sql
  -- 変更前
  WHERE (year > #{startYear} OR (year = #{startYear} AND month >= #{startMonth}))
    AND (year < #{endYear} OR (year = #{endYear} AND month <= #{endMonth}))

  -- 変更後
  WHERE stamp_date >= #{startDate} AND stamp_date < #{endDate}
  ```
- **修正行数**: 3-5行
- **難易度**: **Medium**
- **パフォーマンス**: OR条件削除でインデックスレンジスキャン効率化

**LogHistoryMapper.xml** / **LogHistoryMapper.java**
- **修正**: 不要（log_historyテーブルは無関係）

### 1.3 Service層（7ファイル）

| ファイル | 修正行数 | 難易度 | 主な変更内容 |
|---------|---------|--------|------------|
| **TimestampConverter.java** | 30-40 | **High** | メソッドシグネチャ全面変更、ゼロパディング削除 |
| **StampHistoryPersistence.java** | 10-15 | Medium | year/month/day設定 → stampDate設定 |
| **StampEditService.java** | 15-20 | Medium | parseToOffsetDateTime()の引数変更 |
| **StampCsvDocumentFactory.java** | 10-15 | Medium | CSV列定義の変更（仕様要確認） |
| **StampFormDataExtractor.java** | 5-8 | Low | Map抽出ロジック変更 |
| **StampOutputService.java** | 5-8 | Low | 内部処理のみ、API互換性維持 |
| **StampHistoryService.java** | 5-10 | Low | パラメータ変換処理の簡素化 |

**合計**: 80-126行

### 1.4 Controller層（3ファイル）

**StampRestController.java**
- **修正内容**: API契約の変更
  ```java
  // 変更前
  payload.put("year", request.year());
  payload.put("month", zeroPad(request.month()));
  payload.put("day", zeroPad(request.day()));

  // 変更後
  payload.put("stampDate", request.stampDate());
  ```
- **修正行数**: 20-30行
- **難易度**: **High**
- **API互換性**: ⚠️ **Breaking Change**
  - リクエスト構造変更: `{year, month, day}` → `{stampDate}`
  - 移行期間中の両対応を検討

**StampHistoryRestController.java**
- **修正内容**: レスポンス構造の変更
- **修正行数**: 10-20行
- **難易度**: **Medium to High**
- **API互換性**: ⚠️ **Breaking Change**

**UserProfileRestController.java**
- **修正**: 不要

---

## 🧪 Phase 1: テストコード更新（バックエンド）

### テスト規模一覧

| ファイル | テストケース数 | 修正行数 | 難易度 | 主な変更内容 |
|---------|--------------|---------|--------|------------|
| **TimestampConverterTest** | 22 | 80-100 | **High** | 全メソッドシグネチャ変更、CSVSource再構造化 |
| **StampRestControllerTest** | 18 | 60-70 | **High** | JSON構造変更、ペイロード検証全面書き換え |
| **StampFormDataExtractorTest** | 13 | 40-50 | Medium | Map構造変更、型変換テスト再設計 |
| **StampEditServiceTest** | 11 | 25-30 | Low | ヘルパーメソッド集中修正 |
| **StampHistoryMapperOvertimeCalculationTest** | 6 | 20-25 | Low | insertヘルパーのみ |
| **StampHistoryMapperBatchFetchTest** | 1 | 10-15 | Low | INSERT文の列名変更 |
| **StampHistoryMapperDailyAttendanceTest** | 1 | 5 | Low | INSERT文のみ |
| **StampHistoryRestControllerContractTest** | 3 | 5 | Low | INSERT文のみ |
| **UserProfileRestControllerTest** | 0 | 0 | なし | 影響なし |
| **OutTimeAdjusterTest** | - | 0 | なし | year/month/day使用なし |

**合計**: 75テストケース、245-300行

---

## 🎨 Phase 1: フロントエンド（TypeScript/React）

### 2.1 型定義層（4ファイル）

**types.gen.ts** / **api.ts**（自動生成）
- **修正方法**: OpenAPI仕様変更後、`npm run generate:api` で再生成
- **修正行数**: 0（自動生成）
- **難易度**: **Low**
- **前提**: バックエンドOpenAPI仕様の更新

**frontend/src/features/stampHistory/types/index.ts**
- **修正内容**:
  ```typescript
  // StampHistoryEntry型
  export type StampHistoryEntry = {
    // 削除
    year: string | null;
    month: string | null;
    day: string | null;

    // 追加
    stampDate: string | null;  // "YYYY-MM-DD"
  };

  // CreateStampRequest型
  export type CreateStampRequest = {
    employeeId: number;
    // 削除: year, month, day
    stampDate: string;  // 追加
  };
  ```
- **修正行数**: 8行
- **難易度**: **Low**
- **影響ファイル数**: 6ファイル

**frontend/src/features/profile/types/index.ts**
- **修正**: 不要（月次データは既に"YYYY-MM"形式）

### 2.2 コンポーネント層（4ファイル）

| ファイル | 修正行数 | 難易度 | 主な変更内容 |
|---------|---------|--------|------------|
| **StampHistoryPage.tsx** | 30-40 | **High** | 月の全日付生成ロジック、フィルタリング、ダミーエントリ生成 |
| **StampHistoryCard.tsx** | 8-10 | Low | キー生成、表示フォーマット、aria-label |
| **EditStampDialog.tsx** | 12-15 | Medium | props型変更、API呼び出し |
| **DeleteStampDialog.tsx** | 2-3 | Low | 表示フォーマットのみ |
| Profile関連（5ファイル） | 0 | なし | 影響なし |

**合計**: 52-68行

### 2.3 API/ユーティリティ層（6ファイル）

| ファイル | 修正行数 | 難易度 | 主な変更内容 |
|---------|---------|--------|------------|
| **stampApi.ts** | 15-20 | Medium | mapEntry変換、createStampペイロード |
| **csv-generator.ts** | 3-5 | Low | CSV列定義（条件付き） |
| blob-downloader.ts | 0 | なし | ファイル名のタイムスタンプは無関係 |
| profileApi.ts | 0 | なし | 影響なし |
| queryUtils.ts | 0-3 | Low | クエリキー型定義（オプション） |
| useMemoizedDateFormatter.ts | 0 | なし | 影響なし |

**合計**: 18-28行

### 2.4 新規ユーティリティ（必須）

**frontend/src/shared/utils/dateUtils.ts**（新規作成）
```typescript
/**
 * stamp_date (YYYY-MM-DD) を日本語フォーマットに変換
 */
export const formatStampDate = (stampDate: string | null): string => {
  if (!stampDate) return '-';
  const [year, month, day] = stampDate.split('-');
  return `${year}/${month}/${day}`;
};

/**
 * year/month/day から stamp_date を生成
 */
export const parseStampDate = (year: string, month: string, day: string): string => {
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * stamp_date から year/month/day を抽出
 */
export const extractYearMonthDay = (stampDate: string): {
  year: string;
  month: string;
  day: string;
} => {
  const [year, month, day] = stampDate.split('-');
  return { year, month, day };
};
```
- **行数**: 20-30行
- **難易度**: Low

### 2.5 フロントエンドテスト（5ファイル）

| ファイル | テストケース数 | 修正行数 | 難易度 |
|---------|--------------|---------|--------|
| **csv-generator.test.ts** | 7 | 12-15 | Medium |
| **stampApi.test.ts** | 1 | 6 | Low |
| **StampHistoryPage.lazy.test.tsx** | 2 | 6 | Low |
| **StampHistoryCard.test.tsx** | 7 | 4 + 表示検証 | Medium |
| **StampHistoryPage.test.tsx** | 1 | 2-3 | Low |
| Profile関連（7ファイル） | 0 | 0 | なし |

**合計**: 30-35行

---

## 💾 Phase 2: DB/マイグレーション（Flyway V7予定）

### 3.1 新規マイグレーション

**V7__drop_stamp_history_legacy_columns.sql**（新規作成）
```sql
-- Flyway:Transactional=false

-- 1. 事前確認
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM stamp_history WHERE stamp_date IS NULL) THEN
    RAISE EXCEPTION 'stamp_date に NULL が存在します。移行を中止します。';
  END IF;
END $$;

-- 2. NOT NULL制約を追加
ALTER TABLE stamp_history
  ALTER COLUMN stamp_date SET NOT NULL;

-- 3. トリガー/関数削除（同期不要に）
DROP TRIGGER IF EXISTS trg_stamp_history_sync_stamp_date ON stamp_history;
DROP FUNCTION IF EXISTS sync_stamp_history_stamp_date();

-- 4. 旧カラム削除
ALTER TABLE stamp_history
  DROP COLUMN IF EXISTS year,
  DROP COLUMN IF EXISTS month,
  DROP COLUMN IF EXISTS day;

-- 5. ユニーク制約再作成
ALTER TABLE stamp_history
  DROP CONSTRAINT IF EXISTS uk_employee_date;

ALTER TABLE stamp_history
  ADD CONSTRAINT uk_stamp_history_employee_date
  UNIQUE (employee_id, stamp_date);

-- 6. 旧インデックス削除
DROP INDEX IF EXISTS idx_stamp_history_year_month;
DROP INDEX IF EXISTS idx_stamp_history_employee_date;

-- 7. 新インデックス（既存のstamp_dateインデックスで十分なため不要の場合あり）
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stamp_history_date_month
--   ON stamp_history (stamp_date);

-- 8. 統計更新
ANALYZE stamp_history;
```
- **行数**: 40行
- **難易度**: **High**
- **リスク**: ⚠️ **データ損失の可能性** - 本番前に綿密な検証必須

### 3.2 既存ファイル更新

**V1__init_schema.sql**
- **修正内容**: テンプレートスキーマを最終形に更新
- **修正行数**: 5-10行

**V2__init_data.sql**
- **修正内容**: サンプルデータのINSERT文をstamp_dateに変更
- **修正行数**: データ量次第（未確認、V2が大きすぎて読み込み失敗）

**01_schema.sql**
- **修正内容**: 開発用スキーマファイルの更新
- **修正行数**: 5-10行

**V4__add_performance_indexes.sql**
- **修正**: 不要（旧インデックスはV7で削除）

---

## 📚 Phase 3: ドキュメント更新

### 4.1 Runbook

**docs/runbooks/stamp-date-migration.md**
- **追加内容**: V7マイグレーション手順、ロールバック手順
- **修正行数**: 15-20行
- **難易度**: Low

**docs/runbooks/performance-index-rollout.md**
- **追加内容**: インデックス削除/再作成の手順、EXPLAIN結果
- **修正行数**: 5-10行
- **難易度**: Low

### 4.2 性能記録

**docs/performance-tuning.md**
- **追加内容**: stamp_date正規化完了セクション
  - EXPLAIN (ANALYZE, BUFFERS) 結果
  - Before/Afterのパフォーマンス指標
  - インデックス活用率の記録
- **修正行数**: 10-15行
- **難易度**: Low

---

## 📋 総合実装計画

### 推奨アプローチ: 段階的移行（API互換性維持）

#### Step 1: バックエンド内部の移行（2-3人日）
1. **エンティティ/DTO層**: `StampHistory`に`stampDate`追加（year/month/dayは残す）
2. **Mapper層**: SQLクエリを全て`stamp_date`ベースに変更
3. **Service層**: 内部ロジックを`LocalDate`ベースに変更
4. **Controller層**: API層で`year/month/day ↔ stampDate`変換を実装
   - リクエスト: year/month/day → stampDate変換
   - レスポンス: stampDate → year/month/day派生（後方互換性）
5. **テスト**: バックエンド全テスト更新

**結果**: フロントエンド影響なし、DB最適化達成

#### Step 2: API新バージョン追加（オプション、1人日）
1. `/api/v2/stamp-history`で`stampDate`形式をサポート
2. 旧API (`/api/stamp-history`) は並行運用
3. フロントエンドの段階的移行を可能に

#### Step 3: フロントエンド移行（1.5-2人日）
1. 型定義更新（自動生成）
2. ユーティリティ関数追加
3. コンポーネント/API層更新
4. テスト更新

#### Step 4: 旧API/フィールド削除（0.5人日）
1. エンティティから`year/month/day`削除
2. API v1廃止
3. ドキュメント更新

#### Step 5: DB旧カラム削除（Flyway V7、0.5-1人日）
1. V7マイグレーション作成
2. ステージング検証
3. 本番適用（深夜メンテナンス窓）

---

## ⚠️ リスク評価

| リスク項目 | レベル | 影響 | 対策 |
|-----------|--------|------|------|
| **API互換性破壊** | High | フロントエンド全機能停止 | 段階的移行、両フォーマット対応期間を設ける |
| **データ損失（V7）** | High | 打刻履歴の復旧不能 | V7実行前の完全バックアップ、ステージング完全検証 |
| **パフォーマンス劣化** | Medium | 一時的なロック発生 | 深夜メンテナンス窓、CONCURRENTLY使用 |
| **CSV互換性** | Medium | 既存CSVインポート処理の破壊 | CSV仕様を事前確定、外部連携確認 |
| **テストカバレッジ不足** | Medium | 潜在バグの本番流出 | 全テストケース更新、E2Eテスト実施 |

---

## 📊 工数見積もり詳細

### 実装工数
| フェーズ | 内容 | 工数（人日） |
|---------|------|------------|
| Step 1 | バックエンド内部移行 | 2.0-2.5 |
| Step 1 | バックエンドテスト更新 | 1.5-2.0 |
| Step 3 | フロントエンド移行 | 1.5-2.0 |
| Step 3 | フロントエンドテスト更新 | 0.5 |
| Step 5 | DB移行（V7作成と検証） | 0.5-1.0 |
| 文書化 | Runbook、性能記録 | 0.3 |
| **合計** | | **6.3-8.3** |

### 検証・テスト工数
| 項目 | 工数（人日） |
|------|------------|
| 単体テスト（バックエンド） | 1.0 |
| 単体テスト（フロントエンド） | 0.5 |
| 統合テスト | 0.5 |
| E2Eテスト | 0.5 |
| ステージング検証 | 0.5 |
| **合計** | **3.0** |

### レビュー・調整工数
| 項目 | 工数（人日） |
|------|------------|
| コードレビュー | 1.0 |
| API仕様レビュー | 0.5 |
| 性能測定・調整 | 0.5 |
| **合計** | **2.0** |

### **総工数**: **11.3-13.3人日**

---

## ✅ 受け入れ条件（更新版）

### 機能要件
- [ ] 全APIが`stamp_date`を唯一の日付ソースとして利用
- [ ] `year/month/day`カラムがstamp_historyテーブルに存在しない
- [ ] ユニーク制約が`(employee_id, stamp_date)`のみ
- [ ] 旧インデックス（year_month, employee_date）が削除されている

### 性能要件
- [ ] `idx_stamp_history_stamp_date`が全クエリで活用されている
- [ ] `EXPLAIN (ANALYZE, BUFFERS)`でインデックススキャンを確認
- [ ] 代表クエリの実行時間が旧実装以下
  - `selectDailyAttendance`: TO_DATE変換なし
  - `findMonthlyStatistics`: CONCAT操作なし
  - `getStampHistoryByYearMonthEmployeeId`: 文字列JOINなし

### 品質要件
- [ ] `./gradlew check` が成功（全単体テスト通過）
- [ ] `npm run test --prefix frontend` が成功
- [ ] E2Eテストシナリオが全通過
- [ ] ステージング環境で1週間の安定稼働

### 文書要件
- [ ] `docs/runbooks/stamp-date-migration.md` にV7手順を追記
- [ ] `docs/performance-tuning.md` に性能計測結果を記録
- [ ] OpenAPI仕様書が更新されている
- [ ] Release Noteに互換性情報を明記

---

## 📝 次のアクション

### 即座に実施可能
1. ✅ このレポートをチームレビュー
2. ✅ API仕様変更の影響範囲を関係者と合意
3. ✅ CSV出力フォーマット（統合 vs 分離）を決定

### 準備フェーズ（1-2日）
1. Step 1の実装計画詳細化
2. テストデータ準備
3. ステージング環境の確保

### 実装開始前
1. フィーチャーブランチ作成
2. 進捗管理チケット作成（Jira/GitHub Issues）
3. ペアプログラミング/レビュー担当者アサイン

---

## 付録: ファイル一覧

### バックエンド（本体）27ファイル
```
src/main/java/com/example/teamdev/
├── entity/
│   ├── StampHistory.java
│   ├── StampHistoryDisplay.java
│   └── MonthlyAttendanceStats.java (修正不要)
├── dto/
│   ├── StampEditData.java
│   └── api/stamp/
│       ├── StampCreateRequest.java
│       └── StampHistoryEntryResponse.java
├── form/
│   ├── StampHistoryForm.java
│   ├── StampOutputForm.java
│   └── StampEditForm.java
├── mapper/
│   ├── StampHistoryMapper.java
│   └── LogHistoryMapper.java (修正不要)
├── service/
│   ├── stamp/
│   │   ├── StampFormDataExtractor.java
│   │   ├── StampHistoryPersistence.java
│   │   └── TimestampConverter.java
│   ├── StampHistoryService.java
│   ├── StampOutputService.java
│   ├── StampEditService.java
│   └── StampCsvDocumentFactory.java
└── controller/api/
    ├── StampRestController.java
    ├── StampHistoryRestController.java
    └── UserProfileRestController.java (修正不要)

src/main/resources/com/example/teamdev/mapper/
├── StampHistoryMapper.xml
├── StampDeleteMapper.xml
└── LogHistoryMapper.xml (修正不要)
```

### バックエンド（テスト）10ファイル
```
src/test/java/com/example/teamdev/
├── service/stamp/
│   ├── TimestampConverterTest.java
│   └── StampFormDataExtractorTest.java
├── service/
│   └── StampEditServiceTest.java
├── mapper/
│   ├── StampHistoryMapperOvertimeCalculationTest.java
│   ├── StampHistoryMapperBatchFetchTest.java
│   └── StampHistoryMapperDailyAttendanceTest.java
├── integration/
│   └── StampHistoryRestControllerContractTest.java
└── controller/api/
    ├── UserProfileRestControllerTest.java (修正不要)
    └── StampRestControllerTest.java
```

### フロントエンド（本体）14ファイル
```
frontend/src/
├── types/
│   └── types.gen.ts (自動生成)
├── schemas/
│   └── api.ts (自動生成)
├── features/stampHistory/
│   ├── types/index.ts
│   ├── api/stampApi.ts
│   ├── lib/
│   │   ├── csv-generator.ts
│   │   └── blob-downloader.ts (修正不要)
│   └── components/
│       ├── StampHistoryPage.tsx
│       ├── StampHistoryCard.tsx
│       ├── EditStampDialog.tsx
│       └── DeleteStampDialog.tsx
├── features/profile/ (全修正不要)
└── shared/
    └── utils/
        ├── queryUtils.ts (オプション)
        ├── useMemoizedDateFormatter.ts (修正不要)
        └── dateUtils.ts (新規作成)
```

### フロントエンド（テスト）5ファイル
```
frontend/src/features/stampHistory/
├── components/
│   ├── StampHistoryPage.test.tsx
│   ├── StampHistoryPage.lazy.test.tsx
│   └── StampHistoryCard.test.tsx
├── api/
│   └── stampApi.test.ts
└── __tests__/
    └── csv-generator.test.ts
```

### DB/マイグレーション 5ファイル
```
src/main/resources/
├── db/migration/
│   ├── V1__init_schema.sql
│   ├── V2__init_data.sql (巨大、確認必要)
│   ├── V4__add_performance_indexes.sql (修正不要)
│   ├── V5__add_stamp_history_date_column.sql (完了済み)
│   └── V7__drop_stamp_history_legacy_columns.sql (新規)
└── 01_schema.sql
```

### ドキュメント 3ファイル
```
docs/
├── issues/
│   └── stamp-date-normalization.md (参照元)
├── runbooks/
│   ├── stamp-date-migration.md
│   └── performance-index-rollout.md
└── performance-tuning.md
```

---

**作成**: Claude (Anthropic)
**調査対象コミット**: f529217
**調査完了日**: 2025-11-13
