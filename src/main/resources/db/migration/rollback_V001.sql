-- =====================================================
-- Rollback: TIMESTAMPTZ → TIMESTAMP
-- Purpose: Revert V001__convert_to_timestamptz.sql changes
-- WARNING: Only run if migration failed or needs to be reverted
-- =====================================================

-- Step 1: Drop indexes created in V001
DROP INDEX IF EXISTS idx_stamp_history_in_time_tz;
DROP INDEX IF EXISTS idx_stamp_history_out_time_tz;

-- Step 2: Drop new TIMESTAMPTZ columns
ALTER TABLE stamp_history
DROP COLUMN IF EXISTS in_time_tz,
DROP COLUMN IF EXISTS out_time_tz,
DROP COLUMN IF EXISTS update_date_tz;

-- =====================================================
-- Verification query (run after rollback):
-- =====================================================
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'stamp_history'
-- AND column_name IN ('in_time', 'out_time', 'update_date',
--                     'in_time_tz', 'out_time_tz', 'update_date_tz')
-- ORDER BY column_name;
-- =====================================================
--
-- Expected result: Only old columns (in_time, out_time, update_date) should exist
-- =====================================================
