-- V8: Adjust stamp_request updated_at trigger to use clock_timestamp()
-- This ensures multiple updates within the same transaction get newer timestamps.

CREATE OR REPLACE FUNCTION update_stamp_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = clock_timestamp();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stamp_request_updated_at ON stamp_request;

CREATE TRIGGER trg_stamp_request_updated_at
    BEFORE UPDATE ON stamp_request
    FOR EACH ROW
    EXECUTE FUNCTION update_stamp_request_updated_at();
