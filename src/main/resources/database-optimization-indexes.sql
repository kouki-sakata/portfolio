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

-- 公開フラグでの絞り込み最適化
CREATE INDEX idx_news_release_flag 
ON news (release_flag);

-- 日付での検索・ソート最適化
CREATE INDEX idx_news_date_sort 
ON news (news_date DESC);

-- ==============================
-- 実行統計確認用クエリ
-- ==============================

-- インデックス使用状況確認
-- SHOW INDEX FROM log_history;
-- SHOW INDEX FROM employee;
-- SHOW INDEX FROM stamp_history;
-- SHOW INDEX FROM news;

-- テーブルサイズ確認
-- SELECT 
--   table_name,
--   table_rows,
--   round(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
-- FROM information_schema.tables 
-- WHERE table_schema = 'timemanagerdb';