# Issue: 完全な `stamp_date` 正規化と旧カラム削除

## 背景
- V5 系マイグレーションで `stamp_history.stamp_date (DATE)` を追加し、`year/month/day` との同期トリガーを暫定導入した。
- 現在のアプリは `year/month/day` を主キー相当として参照し続けており、`stamp_date` は一部クエリ（N+1 解消 SQL など）でしか利用されていない。
- 目的は `stamp_date` を唯一の日付ソースとし、重複カラム・トリガー・複数インデックスを廃止して型安全性とパフォーマンスを確保すること。

## 現状（2025-11-13 調査）
- **DB**
  - `stamp_history` には `year/month/day` (VARCHAR) + `stamp_date` (DATE) が併存し、`trg_stamp_history_sync_stamp_date` で双方向同期。
  - インデックス `idx_stamp_history_year_month` / `idx_stamp_history_employee_date` が旧カラムを参照。`idx_stamp_history_stamp_date (employee_id, stamp_date)` は追加済みだが未活用。
  - ユニーク制約 `uk_employee_date` は `(employee_id, year, month, day)` のまま。
- **バックエンド**
  - `StampHistoryMapper#getStampHistoryByYearMonthEmployeeId` / `selectDailyAttendance` / `findMonthlyStatistics` などが `year/month/day` を直接条件に使用。
  - `StampHistoryMapper.save/update` は `stamp_date` を挿入しておらず、`StampHistory` / `StampHistoryDisplay` エンティティにも `stampDate` フィールドが存在しない。
  - `StampRestController`、`StampEditService`、`StampHistoryService`、`StampOutputService`、`StampDeleteService`、フォーム/DTO（`StampCreateRequest` 等）が年・月・日文字列を前提にしている。
  - サンプルデータ (`V2__init_data.sql`)、テスト（`StampHistoryMapperBatchFetchTest` など）も旧カラムで INSERT。
- **フロントエンド**
  - `frontend/src/features/stampHistory/*` で `year/month/day` を型・UI に露出 (`StampHistoryEntry.year` 等)。
  - `/api/stamp-history` 応答スキーマ（OpenAPI 生成）も `year/month/day` を返却フィールドとして定義。

## 課題
1. 現行コードが `stamp_date` を必須とみなしていないため、旧カラム削除ができない。
2. 3本のインデックスとユニーク制約が重複し、更新コストが高い。
3. API / UI で年・月・日の 3 フィールドを扱うため、日付操作のバリデーションが重複している。

## 対応方針
### Phase 1: アプリを `stamp_date` フル利用へ切り替え
- **ドメイン/DTO**
  - `StampHistory` / `StampHistoryDisplay` / `DailyAttendanceRecord` に `LocalDate stampDate` を追加し、年・月・日は表示専用の派生値に限定。
  - `StampEditData`, `StampFormDataExtractor`, `StampCreateRequest`, `StampHistoryEntryResponse` などの DTO を `stampDate` ベースへ移行（必要に応じて旧フィールドは派生値として API 応答に残す）。
- **Mapper & SQL**
  - `StampHistoryMapper.xml` の JOIN / INSERT / UPDATE / SELECT すべてを `stamp_date` 条件に変更。`getStampHistoryByYearMonthDayEmployeeId` は `(employee_id, stamp_date)` 検索へリネーム。
  - `selectDailyAttendance`, `findMonthlyStatistics`, `StampDeleteMapper#deleteStampsByYearMonthRange` は `stamp_date BETWEEN :start AND :end` へ書き換え。
  - `StampHistoryMapper.save/update` で `stamp_date` を必須挿入し、`year/month/day` を削除。
- **サービス / API**
  - `StampEditService` で `LocalDate` を使って OffsetDateTime を生成、`StampRestController` の payload も `stampDate`（ISO 文字列）に一本化。
  - `StampHistoryService` / `StampOutputService` / `StampDeleteService` は `LocalDate` レンジを API 入力とし、UI へ返す `year/month/day` は `stampDate` から `to_char`。
  - バリデーション（フォーム・リクエスト）を `@NotNull LocalDate` or `@Pattern(YYYY-MM-DD)` に差し替え、`zeroPad` などの補助関数を廃止。
- **Front-end**
  - OpenAPI (`@/types`, `frontend/src/types/types.gen.ts`) を更新して `stampDate` を追加。UI では `dayjs(stampDate)` から年月日を派生。
  - 作成/編集ダイアログ (`EditStampDialog`, `StampHistoryPage`, `StampHistoryCard`, CSV 生成等) のパラメータを `date` ベースに書き換え。年・月・日セレクタは `LocalDate` から `YYYY` `MM` を抽出して従来 UI を維持。
  - API レイヤー (`stampApi.ts`) は新しいフィールドへマッピングし、旧フィールドは段階的に削除。
- **テスト / サンプルデータ**
  - `V2__init_data.sql`, `StampHistoryMapper*Test`, `StampHistoryRestControllerContractTest` などの INSERT 文を `stamp_date` のみで記述。
  - フロントの Vitest / React Testing Library で `stampDate` に対応した fixture を更新。

> Phase 1 完了時点でアプリは `stamp_date` のみで動作し、`year/month/day` カラムが空でも影響しない状態にする。

### Phase 2: スキーマクリーンアップ（Flyway V7 予定）
1. 事前確認: `SELECT COUNT(*) FROM stamp_history WHERE stamp_date IS NULL;` が 0。
2. `ALTER TABLE stamp_history ALTER COLUMN stamp_date SET NOT NULL;`
3. 依存トリガー・関数削除: `DROP TRIGGER trg_stamp_history_sync_stamp_date` / `DROP FUNCTION sync_stamp_history_stamp_date()`.
4. 旧カラム DROP: `ALTER TABLE stamp_history DROP COLUMN year, DROP COLUMN month, DROP COLUMN day;`
5. ユニーク制約再作成: `DROP CONSTRAINT uk_employee_date;` → `ADD CONSTRAINT uk_stamp_history_employee_date UNIQUE (employee_id, stamp_date);`
6. インデックス整理:
   - `DROP INDEX IF EXISTS idx_stamp_history_year_month;`
   - `DROP INDEX IF EXISTS idx_stamp_history_employee_date;`
   - `CREATE INDEX CONCURRENTLY idx_stamp_history_date_month ON stamp_history (stamp_date);`（必要に応じて月次レンジ用の partial index を検討）
7. スキーマファイル整合: `V1__init_schema.sql`, `01_schema.sql`, `database-optimization-indexes.sql`、ER 図関連を更新。
8. Runbook (`docs/runbooks/stamp-date-migration.md`, `performance-index-rollout.md`) に V7 手順とロールバックを追記。

### Phase 3: 受入確認 & ナレッジ更新
- `./gradlew check`, `npm run test --prefix frontend`, `./gradlew flywayMigrate -Dspring.profiles.active=dev` を CI で通過させる。
- `docs/performance-tuning.md` に「stamp_date 正規化完了」セクションを追加し、EXPLAIN 結果・指標を記録。
- Release Note / Spec (`.kiro/specs` 追加予定) に API 互換性の扱いを明記。

## 受け入れ条件（更新）
- API・サービス・バッチ・CSV すべてが `stamp_date` を唯一の日付ソースとして利用し、`year/month/day` 列が存在しない。
- `stamp_history` の制約 / インデックスが `(employee_id, stamp_date)` に統一され、`idx_stamp_history_stamp_date` が遅延評価クエリで利用されていることを `EXPLAIN (ANALYZE, BUFFERS)` で確認。
- Flyway V7 実行後に `./gradlew check` および `npm run test --prefix frontend` が成功。
- `docs/runbooks/stamp-date-migration.md` / `docs/performance-tuning.md` に移行手順・計測ログ・ロールバック手順が反映されている。

## 影響規模の目安
- **バックエンドコード**: 15〜20 ファイル（Mapper XML, DTO, Service, Controller, Form, Entity, Tests, Migration脚本）。
- **フロントエンド**: 10〜15 ファイル（API クライアント、型、UI、CSV/ダウンロードユーティリティ、テスト）。
- **DB**: 新規 Flyway (`V7__drop_stamp_history_legacy_columns.sql` 想定) + スキーマテンプレート複数。
- **所要**: 実装 3〜4 人日 + テスト/検証 1 人日（環境調整・Runbook 更新含む）。

## リスク / オープン事項
- API スキーマ変更がフロント・外部連携に影響するため、互換期間 (旧 `year/month/day` をレスポンスに残す) を設けるか要判断。
- 大量削除 (`StampDeleteService`) のパフォーマンス観点で、新しい `DATE` インデックス設計を再検証する必要あり。
- トリガー削除後に外部 ETL 等が直接 `year/month/day` を書き込んでいないか要調査。

## 備考
- 参考: `docs/runbooks/stamp-date-migration.md` / `docs/runbooks/performance-index-rollout.md`
- 依存タスク: Task3 (N+1 解消) で `stamp_date` を利用する検証が可能だが、完全削除フェーズとは別トラックで進める。
