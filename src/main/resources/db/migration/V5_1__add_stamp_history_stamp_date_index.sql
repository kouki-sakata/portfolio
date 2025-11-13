-- V5.1: Isolate the index for stamp_history.stamp_date to avoid mixed transactional statements.

CREATE INDEX IF NOT EXISTS idx_stamp_history_stamp_date
    ON stamp_history (employee_id, stamp_date);
