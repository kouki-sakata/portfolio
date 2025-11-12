# パフォーマンス系インデックス展開 Runbook

## 目的
- `V4__add_performance_indexes.sql` で作成される 13 個のインデックス（log_history 4、本番再保証の news 3、employee 3、stamp_history 3）を安全に展開する。
- インデックス作成後に `ANALYZE` を実行し、代表クエリの `EXPLAIN ANALYZE` / ロック時間を計測して改善効果を記録する。
- 本番リリース時の手順（推奨時間帯、影響緩和、ロールバック）を明文化する。

## 対象インデックス
| テーブル | インデックス名 | カラム構成 / 備考 |
| --- | --- | --- |
| log_history | idx_log_history_update_date_desc | `update_date DESC`（月次一覧ソート最適化） |
| log_history | idx_log_history_employee_id | `employee_id`（JOIN/削除で使用） |
| log_history | idx_log_history_update_employee_id | `update_employee_id`（JOIN 最適化） |
| log_history | idx_log_history_daily_check | `(employee_id, operation_type, update_date)`（当日重複チェック） |
| employee | idx_employee_email_unique | `email` のアプリ側一意保証（FK 依存サービス向け命名） |
| employee | idx_employee_admin_flag | `admin_flag`（管理者絞り込み） |
| employee | idx_employee_name_search | `(first_name, last_name)`（DataTables 検索） |
| stamp_history | idx_stamp_history_year_month | `(year, month)`（大量削除レンジ最適化） |
| stamp_history | idx_stamp_history_employee_date | `(employee_id, year, month, day)`（勤怠詳細/N+1 解消クエリ） |
| stamp_history | idx_stamp_history_update_date | `update_date DESC`（最新更新順整列） |
| news | idx_news_date | `news_date DESC`（一覧共通カバリング、再保証） |
| news | idx_news_release_date | `(release_flag, news_date DESC)`（公開済み一覧） |
| news | idx_news_published | `news_date DESC WHERE release_flag = TRUE`（公開済みのみ） |

> 備考: `idx_news_label_release` は V1 で既に作成済みのため V4 では対象外。

## ステージング展開手順
1. **作業前確認**
   - `git status -sb` と `./gradlew flywayInfo` で V4 未適用を確認。
   - DB 接続パラメータ: `SPRING_PROFILES_ACTIVE=stg` で `.env` を読み出しておく。
2. **マイグレーション実行**
   - `./gradlew flywayMigrate -Dflyway.configFiles=flyway-stg.conf` を実行。
   - Flyway が `V4__add_performance_indexes.sql` を適用する。`CREATE INDEX CONCURRENTLY` のためトランザクション制御は Flyway 側で無効化済み。
3. **統計更新 (ANALYZE)**
   - `psql` 等で以下を実行し、作成直後の統計不足を解消。
     ```sql
     ANALYZE log_history;
     ANALYZE employee;
     ANALYZE stamp_history;
     ANALYZE news;
     ```
4. **代表クエリの EXPLAIN ANALYZE**
   - log_history 月次一覧:
     ```sql
     EXPLAIN (ANALYZE, BUFFERS)
     SELECT ... FROM log_history ... WHERE update_date BETWEEN :start AND :end ORDER BY update_date DESC;
     ```
   - `StampDeleteMapper` 用レンジ削除（dry-run = `EXPLAIN` のみ）。
   - `StampHistoryMapper#getStampHistoryByYearMonthEmployeeId`（N+1 対策前後で比較）。
   - `EmployeeMapper#findFilteredEmployees` (`searchValue` あり / なし)。
   - 記録フォーマット: `docs/performance-metrics/YYYYMMDD-indexes.md`（新規ファイル可）。
5. **ロック時間計測**
   - 実行中/直後に `SELECT pg_locks.pid, locktype, relation::regclass, mode FROM pg_locks JOIN pg_stat_activity USING (pid) WHERE query LIKE 'CREATE INDEX%';`
   - `pg_stat_activity.wait_event_type = 'Lock'` を記録し、最大待機時間を Runbook に追記。
6. **正常性確認**
   - `./gradlew check -x frontendTests`（インデックスのみのため API テスト中心）を実行。
   - 監査: `SELECT indexname, idx_scan FROM pg_stat_user_indexes WHERE schemaname = 'public' ORDER BY idx_scan DESC;` でスキャン回数を取得し、初期化直後で 0 でも問題ない旨を記載。

## 本番リリース手順
1. **準備**
   - 推奨時間帯: 曜日問わず 01:00–02:00 JST（勤怠打刻トラフィック最小）。
   - バッチ/ETL 等の大量書き込みジョブを一時停止。
   - 監視: `pg_stat_activity` を別セッションで監視し、長時間トランザクションが存在しないことを確認。
2. **適用フロー**
   1. アプリ接続を維持したまま `./gradlew flywayMigrate -Dspring.profiles.active=prod` を実行。
   2. 各 `CREATE INDEX CONCURRENTLY` の進捗を `SELECT phase FROM pg_stat_progress_create_index;` で監視。
   3. 作成完了後すぐに `ANALYZE` を同一順序で実行。
3. **リリース後検証**
   - 代表 API (`/api/log-history`, `/api/stamps/export`, `/api/employees`) を 1 回ずつ叩き、レスポンス時間を Grafana で比較。
   - `pg_stat_user_indexes` の `idx_scan` に増加が出ているか 24 時間後に再確認。
4. **ロールバック戦略**
   - インデックスが原因で問題が出た場合は以下を順番に実行。
     ```sql
     DROP INDEX CONCURRENTLY IF EXISTS idx_log_history_daily_check;
     ... -- 影響の大きいものから順にドロップ
     ```
   - ドロップ後に `ANALYZE` と `pg_stat_statements_reset()` を実施し、元の統計へ戻す。
   - 最終手段として `flyway repair` で V4 を `failed` 状態に設定し、再適用を一時停止。

## 記録テンプレート
```
日付: 2025-11-12
環境: staging / production
実行者: <name>
コマンドログ: （flywayMigrate, ANALYZE, EXPLAIN, ロック計測）
代表クエリ結果:
  - log_history 月次: Total runtime xx ms → yy ms
  - employee search: 95th percentile 230ms → 120ms
ロック計測: 最大待機 0.8s @ idx_stamp_history_employee_date
備考: 影響なし
```

## 参考クエリ集
- `SELECT relname, indexrelname, idx_scan, idx_tup_read FROM pg_stat_user_indexes WHERE relname IN ('log_history','stamp_history','employee','news') ORDER BY idx_scan DESC;`
- `SELECT schemaname, relname, n_live_tup FROM pg_stat_user_tables WHERE relname IN ('log_history','stamp_history');`

## JSONB (log_history.detail) GIN インデックス手順
1. **マイグレーション確認**
   - `./gradlew flywayInfo | grep V6__reduce_jsonb_dependencies` で未適用を確認。
   - 適用は `./gradlew flywayMigrate -Dflyway.configFiles=flyway-stg.conf -Dflyway.target=6` を推奨（V6 単体）。
2. **GIN インデックス作成**
   - `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_log_history_detail_gin ON log_history USING gin(detail jsonb_path_ops);`
   - 作成中は `SELECT phase, tuples_total, tuples_done FROM pg_stat_progress_create_index WHERE index_relname = 'idx_log_history_detail_gin';` を監視。
3. **統計更新とキャッシュウォームアップ**
   - `ANALYZE log_history;`
   - `/api/profile/*` を 3 件叩き、`log_history` へ最新データを追加しヒストグラムを刷新。
4. **EXPLAIN 検証**
   - 代表クエリ: `EXPLAIN (ANALYZE, BUFFERS)` +
     ```sql
     SELECT id, update_date
     FROM log_history
     WHERE detail ->> 'before' ILIKE '%scheduleStart%'
     ORDER BY update_date DESC
     LIMIT 50;
     ```
   - 期待プラン: `Bitmap Index Scan on idx_log_history_detail_gin` → `Bitmap Heap Scan`
   - 期待統計: Seq Scan 150ms → Bitmap Heap Scan 30ms 前後（stg 1M rows 基準）。
5. **運用監視**
   - 24 時間後に `SELECT idx_scan FROM pg_stat_user_indexes WHERE indexrelname = 'idx_log_history_detail_gin';` を採取し、アクセス増を確認。
   - 監査ログ保管: `docs/performance-metrics/YYYYMMDD-gin-detail.md` に EXPLAIN / バッファ情報を追記。
6. **ロールバック**
   - 異常時は `DROP INDEX CONCURRENTLY IF EXISTS idx_log_history_detail_gin;` → `ANALYZE log_history;`。
   - JSONB への回帰は不要（アプリ側は schedule カラムを参照）。

## 今後の TODO
- `stamp_date` 列導入（V5）後は `idx_stamp_history_year_month` / `idx_stamp_history_employee_date` を `stamp_date` ベースにリビルドするプランを追加。
