-- =================================
-- データベース最適化マイグレーション
-- Version: 1.1.0
-- Date: 2025-07-23
-- =================================

USE timemanagerdb;

-- ==============================
-- パフォーマンス測定用の設定
-- ==============================
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1.0;
SET GLOBAL log_queries_not_using_indexes = 'ON';

-- ==============================
-- 1. 重要なインデックス追加
-- ==============================

-- log_historyテーブルの最適化
-- 最も頻繁な検索：年月範囲検索 + 更新日時ソート
ALTER TABLE log_history 
ADD INDEX idx_log_history_update_date_desc (update_date DESC);

-- JOIN用のインデックス
ALTER TABLE log_history 
ADD INDEX idx_log_history_employee_id (employee_id);

ALTER TABLE log_history 
ADD INDEX idx_log_history_update_employee_id (update_employee_id);

-- 重複チェック用の複合インデックス
ALTER TABLE log_history 
ADD INDEX idx_log_history_daily_check (employee_id, operation_type, update_date);

-- employeeテーブルの最適化
-- メールアドレスのユニーク制約（データ整合性 + パフォーマンス）
ALTER TABLE employee 
ADD UNIQUE INDEX idx_employee_email_unique (email);

-- 管理者フラグでの絞り込み用
ALTER TABLE employee 
ADD INDEX idx_employee_admin_flag (admin_flag);

-- 従業員名での検索用（DataTables検索機能）
ALTER TABLE employee 
ADD INDEX idx_employee_name_search (first_name, last_name);

-- stamp_historyテーブルの最適化
-- 年月検索用（現在の文字列型に対応）
ALTER TABLE stamp_history 
ADD INDEX idx_stamp_history_year_month (year, month);

-- 従業員と日付での検索用
ALTER TABLE stamp_history 
ADD INDEX idx_stamp_history_employee_date (employee_id, year, month, day);

-- 更新日時での検索用
ALTER TABLE stamp_history 
ADD INDEX idx_stamp_history_update_date (update_date DESC);

-- newsテーブルの最適化
-- 公開フラグでの絞り込み用
ALTER TABLE news 
ADD INDEX idx_news_release_flag (release_flag);

-- 日付でのソート用
ALTER TABLE news 
ADD INDEX idx_news_date_sort (news_date DESC);

-- ==============================
-- 2. データ型最適化（将来検討用）
-- ==============================

-- 注意：実際の運用では、以下の変更は慎重に検討すること
-- 
-- stamp_historyテーブルの年月日をDATETIME型に変更する場合：
-- ALTER TABLE stamp_history 
-- ADD COLUMN date_column DATE GENERATED ALWAYS AS 
-- (STR_TO_DATE(CONCAT(year, '-', LPAD(month, 2, '0'), '-', LPAD(day, 2, '0')), '%Y-%m-%d')) STORED;
--
-- ALTER TABLE stamp_history 
-- ADD INDEX idx_stamp_history_date_column (date_column);

-- ==============================
-- 3. パフォーマンス統計更新
-- ==============================

-- テーブル統計情報の更新
ANALYZE TABLE employee;
ANALYZE TABLE log_history;
ANALYZE TABLE stamp_history;
ANALYZE TABLE news;

-- ==============================
-- 4. 確認用クエリ
-- ==============================

-- インデックス状況確認
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    CARDINALITY,
    INDEX_TYPE
FROM 
    INFORMATION_SCHEMA.STATISTICS 
WHERE 
    TABLE_SCHEMA = 'timemanagerdb' 
    AND INDEX_NAME != 'PRIMARY'
ORDER BY 
    TABLE_NAME, INDEX_NAME;

-- テーブルサイズとパフォーマンス確認
SELECT 
    table_name,
    table_rows,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size_MB',
    ROUND((data_length / 1024 / 1024), 2) AS 'Data_MB',
    ROUND((index_length / 1024 / 1024), 2) AS 'Index_MB'
FROM 
    information_schema.tables 
WHERE 
    table_schema = 'timemanagerdb'
ORDER BY 
    (data_length + index_length) DESC;