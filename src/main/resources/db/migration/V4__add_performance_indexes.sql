-- Flyway:Transactional=false
-- V4: Performance index rollout driven by plan.md Task 1.

-- ==============================
-- log_history indexes
-- ==============================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_log_history_update_date_desc
    ON log_history (update_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_log_history_employee_id
    ON log_history (employee_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_log_history_update_employee_id
    ON log_history (update_employee_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_log_history_daily_check
    ON log_history (employee_id, operation_type, update_date);

-- ==============================
-- employee indexes
-- ==============================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_admin_flag
    ON employee (admin_flag);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_name_search
    ON employee (first_name, last_name);

-- ==============================
-- stamp_history indexes
-- ==============================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stamp_history_year_month
    ON stamp_history (year, month);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stamp_history_employee_date
    ON stamp_history (employee_id, year, month, day);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stamp_history_update_date
    ON stamp_history (update_date DESC);

-- ==============================
-- news indexes (idempotent safety)
-- ==============================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_news_date
    ON news (news_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_news_release_date
    ON news (release_flag, news_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_news_published
    ON news (news_date DESC)
    WHERE release_flag = TRUE;
