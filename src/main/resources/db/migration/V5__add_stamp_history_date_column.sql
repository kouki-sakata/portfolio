-- Flyway:Transactional=false
-- V5: Normalize stamp_history date handling with a synced DATE column.

ALTER TABLE stamp_history
    ADD COLUMN IF NOT EXISTS stamp_date DATE;

COMMENT ON COLUMN stamp_history.stamp_date IS '年月日を一意に表す DATE カラム（移行中は year/month/day と二重保持）';

UPDATE stamp_history
SET stamp_date = make_date(year::integer, month::integer, day::integer)
WHERE stamp_date IS NULL
  AND year ~ '^[0-9]{4}$'
  AND month ~ '^[0-9]{1,2}$'
  AND day ~ '^[0-9]{1,2}$';

CREATE OR REPLACE FUNCTION sync_stamp_history_stamp_date()
RETURNS trigger AS
$$
DECLARE
    derived_date DATE;
BEGIN
    IF NEW.stamp_date IS NOT NULL THEN
        NEW.year := to_char(NEW.stamp_date, 'YYYY');
        NEW.month := to_char(NEW.stamp_date, 'MM');
        NEW.day := to_char(NEW.stamp_date, 'DD');
    ELSIF NEW.year IS NOT NULL AND NEW.month IS NOT NULL AND NEW.day IS NOT NULL THEN
        BEGIN
            derived_date := make_date(NEW.year::integer, NEW.month::integer, NEW.day::integer);
            NEW.stamp_date := derived_date;
        EXCEPTION WHEN others THEN
            -- 無効な値は NULL のまま許容
            NEW.stamp_date := NULL;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stamp_history_sync_stamp_date ON stamp_history;

CREATE TRIGGER trg_stamp_history_sync_stamp_date
    BEFORE INSERT OR UPDATE ON stamp_history
    FOR EACH ROW
    EXECUTE FUNCTION sync_stamp_history_stamp_date();

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stamp_history_stamp_date
    ON stamp_history (employee_id, stamp_date);
