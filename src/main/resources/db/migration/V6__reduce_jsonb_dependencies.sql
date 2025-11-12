-- Flyway:Transactional=false
-- V6: Reduce JSONB dependencies by normalizing schedule fields and indexing profile audit JSONB.

ALTER TABLE employee
    ADD COLUMN IF NOT EXISTS schedule_start TIME WITHOUT TIME ZONE DEFAULT '09:00'::time,
    ADD COLUMN IF NOT EXISTS schedule_end TIME WITHOUT TIME ZONE DEFAULT '18:00'::time,
    ADD COLUMN IF NOT EXISTS schedule_break_minutes INTEGER DEFAULT 60;

WITH schedule_source AS (
    SELECT
        id,
        CASE
            WHEN (profile_metadata->'schedule'->>'start') ~ '^[0-2][0-9]:[0-5][0-9]$'
                THEN (profile_metadata->'schedule'->>'start')::time
            ELSE NULL
        END AS schedule_start,
        CASE
            WHEN (profile_metadata->'schedule'->>'end') ~ '^[0-2][0-9]:[0-5][0-9]$'
                THEN (profile_metadata->'schedule'->>'end')::time
            ELSE NULL
        END AS schedule_end,
        CASE
            WHEN (profile_metadata->'schedule'->>'breakMinutes') ~ '^[0-9]+$'
                THEN (profile_metadata->'schedule'->>'breakMinutes')::int
            ELSE NULL
        END AS schedule_break_minutes
    FROM employee
)
UPDATE employee e
SET schedule_start = COALESCE(s.schedule_start, e.schedule_start, '09:00'::time),
    schedule_end = COALESCE(s.schedule_end, e.schedule_end, '18:00'::time),
    schedule_break_minutes = COALESCE(s.schedule_break_minutes, e.schedule_break_minutes, 60)
FROM schedule_source s
WHERE e.id = s.id;

UPDATE employee
SET profile_metadata = profile_metadata - 'schedule'
WHERE profile_metadata ? 'schedule';

ALTER TABLE employee
    ALTER COLUMN schedule_start SET NOT NULL,
    ALTER COLUMN schedule_end SET NOT NULL,
    ALTER COLUMN schedule_break_minutes SET NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_log_history_detail_gin
    ON log_history USING gin (detail jsonb_path_ops);
