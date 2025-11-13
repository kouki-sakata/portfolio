# `stamp_date` カラム導入 Runbook (V5)

## 目的
- `stamp_history` に DATE 型カラム `stamp_date` を追加し、既存の `year/month/day` との二重同期を行う。
- データ移行時間とロック影響を把握し、本番適用時のリスクを最小化する。
- 失敗時に安全にロールバックするための手順を明文化する。

## マイグレーション内容
1. `stamp_date DATE` カラムを追加し、既存データを `make_date(year::int, month::int, day::int)` で更新。
2. `sync_stamp_history_stamp_date()` トリガー関数で `stamp_date` と `year/month/day` を相互同期。
3. `idx_stamp_history_stamp_date (employee_id, stamp_date)` を `CREATE INDEX CONCURRENTLY` で作成。

## ステージング適用手順
1. **事前確認**
   - `./gradlew flywayInfo` で `V5__add_stamp_history_date_column` が `Pending` であることを確認。
   - ステージング DB の接続情報を `.env.stg` / Vault から取得。
2. **マイグレーション実行**
   - `time ./gradlew flywayMigrate -Dspring.profiles.active=stg` を実行し、`real` 行をメモ（目標 < 3s）。
   - 実行ログ中の `Executing SQL Statement: CREATE TRIGGER...` などを Caputure し `docs/performance-metrics/YYYYMMDD-stamp-date.md` に貼り付ける。
3. **統計更新**
   ```sql
   ANALYZE stamp_history;
   ```
4. **代表クエリ計測 (`EXPLAIN ANALYZE`)**
   - `SELECT ... FROM stamp_history WHERE stamp_date BETWEEN :start AND :end AND employee_id = :id;`
   - `SELECT ...` (CSV 出力用) で旧 `year/month/day` と比較。`Buffers` 情報を記録。
5. **トリガー動作検証**
   ```sql
   INSERT INTO stamp_history (year, month, day, employee_id, update_employee_id, update_date)
   VALUES ('2025','11','12', 9999, 1, now()) RETURNING id;
   SELECT year, month, day, stamp_date FROM stamp_history WHERE id = <戻り値>;

   INSERT INTO stamp_history (stamp_date, employee_id, update_employee_id, update_date)
   VALUES ('2025-11-13', 9998, 1, now());
   SELECT year, month, day, stamp_date FROM stamp_history WHERE id = <戻り値>;
   ```
   - どちらのパスでも値が同期することを確認したらテストデータを削除。
6. **ロック/時間計測**
   - `SELECT phase, lockers_total FROM pg_stat_progress_create_index WHERE index_relid::regclass = 'idx_stamp_history_stamp_date'::regclass;`
   - `SELECT pg_size_pretty(pg_relation_size('idx_stamp_history_stamp_date'));` でサイズ記録。

## 本番適用ガイド
1. **推奨時間帯**: 平日 00:30–01:00 JST。従業員の打刻がほぼ無い時間帯。
2. **事前準備**
   - CSV 出力やバッチ処理を一時停止。
   - 長期トランザクションが無いか `SELECT pid, state, query FROM pg_stat_activity WHERE state != 'idle';` で確認。
3. **実行**
   - `time ./gradlew flywayMigrate -Dspring.profiles.active=prod` を実行し、開始時刻と終了時刻を Slack #ops に報告。
   - `ANALYZE stamp_history;` を即時実行。
4. **事後確認**
   - `EXPLAIN (ANALYZE)` で `stamp_history` の代表クエリを 1 回ずつ実行。
   - `pg_stat_user_indexes` の `idx_stamp_history_stamp_date`/`idx_stamp_history_employee_date` の `idx_scan` を24時間後に比較。

## ロールバック手順
1. **インデックストリガー撤去**
   ```sql
   DROP INDEX CONCURRENTLY IF EXISTS idx_stamp_history_stamp_date;
   DROP TRIGGER IF EXISTS trg_stamp_history_sync_stamp_date ON stamp_history;
   DROP FUNCTION IF EXISTS sync_stamp_history_stamp_date();
   ALTER TABLE stamp_history DROP COLUMN IF EXISTS stamp_date;
   ```
2. **統計復旧**
   - `ANALYZE stamp_history;`
3. **Flyway メタデータ**
   - `./gradlew flywayRepair` で `V5` を `Pending` 状態に戻し、再実行できるようにする。

## 計測テンプレ
```
日付: 2025-11-12
環境: staging
実行時間: 2.4s (CREATE INDEX 1.1s)
ロック待機: 0s
ANALYZE 所要: 80ms
テスト結果:
  - getStampHistoryByYearMonthEmployeeId → 320ms → 170ms
  - CSV export (100 employees) → 14 クエリ → 1 クエリ (後続タスク)
備考: テストデータ削除済み
```

## Follow-up
- `docs/issues/stamp-date-normalization.md` に完全移行タスクの原稿を作成済み。Issue 登録時はテンプレをコピーして利用する。
