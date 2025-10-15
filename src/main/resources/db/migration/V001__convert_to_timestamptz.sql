-- =====================================================
-- Migration: TIMESTAMP → TIMESTAMPTZ
-- Purpose: Fix timezone handling for stamp_history table
-- Strategy: Zero-downtime migration with new columns
-- =====================================================

-- Step 1: Add new TIMESTAMPTZ columns
-- These will coexist with old TIMESTAMP columns during migration
ALTER TABLE stamp_history
ADD COLUMN in_time_tz TIMESTAMPTZ,
ADD COLUMN out_time_tz TIMESTAMPTZ,
ADD COLUMN update_date_tz TIMESTAMPTZ;

-- Step 2: Copy existing data to new columns
-- Interpret existing TIMESTAMP values as Asia/Tokyo and convert to UTC
-- Example: "2025-10-14 12:00:00" (JST) → "2025-10-14 03:00:00+00" (UTC)
UPDATE stamp_history
SET in_time_tz = in_time AT TIME ZONE 'Asia/Tokyo'
WHERE in_time IS NOT NULL;

UPDATE stamp_history
SET out_time_tz = out_time AT TIME ZONE 'Asia/Tokyo'
WHERE out_time IS NOT NULL;

UPDATE stamp_history
SET update_date_tz = update_date AT TIME ZONE 'Asia/Tokyo'
WHERE update_date IS NOT NULL;

-- Step 3: Add NOT NULL constraint to update_date_tz (if needed)
-- This ensures data integrity for the required field
-- Note: Uncomment after confirming all data is migrated
-- ALTER TABLE stamp_history ALTER COLUMN update_date_tz SET NOT NULL;

-- Step 4: Create indexes on new columns (optional, for performance)
-- These will be used after application deployment
CREATE INDEX IF NOT EXISTS idx_stamp_history_in_time_tz
ON stamp_history(in_time_tz);

CREATE INDEX IF NOT EXISTS idx_stamp_history_out_time_tz
ON stamp_history(out_time_tz);

-- =====================================================
-- Verification queries (run after migration):
-- =====================================================
-- SELECT
--   id,
--   in_time as old_in_time,
--   in_time_tz as new_in_time,
--   out_time as old_out_time,
--   out_time_tz as new_out_time
-- FROM stamp_history
-- ORDER BY id DESC
-- LIMIT 10;
-- =====================================================
