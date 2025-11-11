-- Add night shift flag to stamp_history table
-- Migration: Add is_night_shift column

ALTER TABLE stamp_history
ADD COLUMN is_night_shift BOOLEAN;

-- Add index for querying night shift records
CREATE INDEX idx_stamp_history_night_shift ON stamp_history(is_night_shift) WHERE is_night_shift = TRUE;

-- Add comment
COMMENT ON COLUMN stamp_history.is_night_shift IS '夜勤フラグ: TRUE=夜勤, FALSE=通常勤務, NULL=未設定（過去データ）';
