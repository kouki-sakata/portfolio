-- =================================
-- データベース最適化用インデックス作成SQL
-- =================================

-- ==============================
-- 1. log_historyテーブルの最適化
-- ==============================

-- 最も頻繁な検索条件: 年月での検索 + 更新日時ソート
-- YEAR()、MONTH()関数を使わず、範囲検索可能な複合インデックス
CREATE INDEX idx_log_history_update_date_desc 
ON log_history (update_date DESC);

-- 従業員ID検索の最適化（JOIN用）
CREATE INDEX idx_log_history_employee_id 
ON log_history (employee_id);

-- 更新従業員ID検索の最適化（JOIN用）
CREATE INDEX idx_log_history_update_employee_id 
ON log_history (update_employee_id);

-- 重複チェッククエリの最適化
CREATE INDEX idx_log_history_daily_check 
ON log_history (employee_id, operation_type, update_date);

-- ==============================
-- 2. employeeテーブルの最適化
-- ==============================

-- メールアドレスの重複チェック高速化とデータ整合性
CREATE UNIQUE INDEX idx_employee_email_unique 
ON employee (email);

-- 管理者フラグでの絞り込み最適化
CREATE INDEX idx_employee_admin_flag 
ON employee (admin_flag);

-- 従業員名での検索最適化（DataTables用）
CREATE INDEX idx_employee_name_search 
ON employee (first_name, last_name);

-- ==============================
-- 3. stamp_historyテーブルの最適化
-- ==============================

-- 年月での検索最適化（現在の文字列型のまま）
CREATE INDEX idx_stamp_history_year_month 
ON stamp_history (year, month);

-- 従業員IDでの検索最適化
CREATE INDEX idx_stamp_history_employee_date 
ON stamp_history (employee_id, year, month, day);

-- 更新日時での検索最適化
CREATE INDEX idx_stamp_history_update_date 
ON stamp_history (update_date DESC);

-- ==============================
-- 4. newsテーブルの最適化
-- ==============================

-- newsテーブルのインデックスは01_schema.sqlで既に作成済み:
-- - idx_news_date (news_date DESC)
-- - idx_news_release_date (release_flag, news_date DESC)
-- - idx_news_published (news_date DESC) WHERE release_flag = TRUE
--
-- 追加のインデックスは不要です。

-- ==============================
-- 実行統計確認用クエリ（PostgreSQL版）
-- ==============================

-- インデックス使用状況確認
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan AS index_scans
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan;

-- テーブルサイズ確認
-- SELECT
--   schemaname AS schema_name,
--   tablename AS table_name,
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
--   pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;