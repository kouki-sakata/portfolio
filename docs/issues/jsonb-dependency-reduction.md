# Issue: JSONB 依存削減と型安全化

## 背景
- `employee.profile_metadata` と `log_history.detail` が JSONB のまま肥大化し、インデックス未整備。
- SQL からのキー参照が増え、型安全性とパフォーマンスの両面でリスクがある。

## スコープ
1. **profile_metadata の正規化**
   - 勤務スケジュール (`start`, `end`, `breakMinutes`) を専用カラムへ切り出し。
   - JSONB 側は「補助情報のみ」に縮小し、アプリ層で DTO を更新。
2. **log_history.detail の GIN インデックス検証**
   - 利用中のキー一覧を棚卸し (`operation_type`, `before`, `after` など)。
   - `CREATE INDEX idx_log_history_detail_gin ON log_history USING gin(detail jsonb_path_ops);` の効果測定。
3. **アプリケーション更新**
   - `LogHistoryDisplay` / `EmployeeProfile` DTO を新カラムへ切り替え。
   - Flyway `V6__reduce_jsonb_dependencies.sql` でカラム追加＆データ移行。

## 受け入れ条件
- 勤務スケジュール参照 SQL が JSONB -> 通常カラムへ置換されている。
- `log_history.detail` に対する検索 (`detail->>'before'`) が GIN インデックスを利用していることを `EXPLAIN` で確認。
- `docs/performance-tuning.md` に計測結果が追記され、旧 JSONB 依存箇所が一覧化されている。

## 関連
- 先行タスク: `docs/issues/stamp-date-normalization.md`
- Runbook: `docs/runbooks/performance-index-rollout.md`（GIN 計測手順を追記予定）
