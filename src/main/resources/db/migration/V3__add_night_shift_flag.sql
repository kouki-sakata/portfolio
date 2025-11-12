-- Add night shift flag to stamp_history table
-- Migration: Add is_night_shift column

-- Add column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'stamp_history'
        AND column_name = 'is_night_shift'
    ) THEN
        ALTER TABLE stamp_history ADD COLUMN is_night_shift BOOLEAN;
    END IF;
END $$;

-- Add index for querying night shift records (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_stamp_history_night_shift'
    ) THEN
        CREATE INDEX idx_stamp_history_night_shift ON stamp_history(is_night_shift) WHERE is_night_shift = TRUE;
    END IF;
END $$;

-- Add comment
COMMENT ON COLUMN stamp_history.is_night_shift IS '夜勤フラグ: TRUE=夜勤, FALSE=通常勤務, NULL=未設定（過去データ）';
