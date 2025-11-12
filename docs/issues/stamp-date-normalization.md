# Issue: 完全な `stamp_date` 正規化と旧カラム削除

## 背景
- V5 マイグレーションで `stamp_date` (DATE) を追加し、`year/month/day` との同期トリガーを導入した。
- アプリケーション側は依然として `year/month/day` フィールドを参照しているため、完全な正規化とクリーンアップが必要。

## やること
1. **アプリ改修**
   - `StampHistoryMapper` / `StampOutputService` を `stamp_date` ベースの照会に切り替え。
   - DTO・CSV 出力など日付表示処理は `stamp_date` から `to_char` で生成。
2. **DB スキーマ整理**
   - トリガー `trg_stamp_history_sync_stamp_date` / 関数 `sync_stamp_history_stamp_date()` を削除。
   - `year/month/day` カラムを DROP（移行中はビュー or マテビューで互換性確保）。
   - `idx_stamp_history_year_month` / `idx_stamp_history_employee_date` を `stamp_date` ベースへリビルド。
3. **データ移行完了宣言**
   - Flyway `V6__drop_stamp_history_legacy_columns.sql` を追加。
   - Runbook 更新・リリースノート作成。

## 受け入れ条件
- API/CSV/バッチすべて `stamp_date` から日付情報を取得しており、`year/month/day` は存在しない。
- Flyway + `./gradlew check` が通り、`stamp_history` のユニーク制約は `(employee_id, stamp_date)` に移行済み。
- Runbook/performance doc に正規化完了が明記されている。

## 備考
- 参考: `docs/runbooks/stamp-date-migration.md` / `docs/runbooks/performance-index-rollout.md`
- 依存タスク: Task3 (N+1 解消) で `stamp_date` を利用すると検証しやすい。
