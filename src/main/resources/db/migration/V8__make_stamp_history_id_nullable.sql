-- V8: Make stamp_history_id nullable to support requests without existing stamp records
-- This allows employees to submit correction requests for dates where they forgot to stamp

-- 1. Make stamp_history_id nullable
ALTER TABLE stamp_request
  ALTER COLUMN stamp_history_id DROP NOT NULL;

-- 2. Drop existing partial unique index (only works for stamp_history_id NOT NULL)
DROP INDEX IF EXISTS idx_stamp_request_pending_unique;

-- 3. Create new partial unique index for requests WITHOUT stamp history
--    Prevents duplicate PENDING requests for the same employee and date
CREATE UNIQUE INDEX idx_stamp_request_pending_unique_no_history
    ON stamp_request(employee_id, stamp_date)
    WHERE status = 'PENDING' AND stamp_history_id IS NULL;

-- 4. Create partial unique index for requests WITH stamp history
--    Prevents duplicate PENDING requests for the same employee and stamp_history_id
CREATE UNIQUE INDEX idx_stamp_request_pending_unique_with_history
    ON stamp_request(employee_id, stamp_history_id)
    WHERE status = 'PENDING' AND stamp_history_id IS NOT NULL;

-- Add comments for clarity
COMMENT ON INDEX idx_stamp_request_pending_unique_no_history IS
  'Prevents duplicate PENDING requests for the same employee and date when stamp_history_id is NULL (forgot to stamp scenario)';

COMMENT ON INDEX idx_stamp_request_pending_unique_with_history IS
  'Prevents duplicate PENDING requests for the same employee and stamp_history_id when stamp_history_id is NOT NULL (correction scenario)';

COMMENT ON COLUMN stamp_request.stamp_history_id IS
  'References stamp_history.id. NULL when the employee forgot to stamp and is requesting to add a new record.';
