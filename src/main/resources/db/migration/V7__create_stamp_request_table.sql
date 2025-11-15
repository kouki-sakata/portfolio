-- V7: Create stamp_request table for approval workflow
-- Requirements: 1, 2, 3, 4, 6, 7, 8, 9

-- Create enum type for request status
CREATE TYPE stamp_request_status AS ENUM ('NEW', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- Create stamp_request table
CREATE TABLE stamp_request (
    -- Primary key
    id SERIAL PRIMARY KEY,

    -- Foreign keys
    employee_id INTEGER NOT NULL REFERENCES employee(id),
    stamp_history_id INTEGER NOT NULL REFERENCES stamp_history(id),

    -- Request metadata
    stamp_date DATE NOT NULL,
    status stamp_request_status NOT NULL DEFAULT 'PENDING',

    -- Original values (immutable snapshot from stamp_history at submission time)
    original_in_time TIMESTAMP WITH TIME ZONE,
    original_out_time TIMESTAMP WITH TIME ZONE,
    original_break_start_time TIMESTAMP WITH TIME ZONE,
    original_break_end_time TIMESTAMP WITH TIME ZONE,
    original_is_night_shift BOOLEAN,

    -- Requested values (what the employee wants to change to)
    requested_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    requested_out_time TIMESTAMP WITH TIME ZONE,
    requested_break_start_time TIMESTAMP WITH TIME ZONE,
    requested_break_end_time TIMESTAMP WITH TIME ZONE,
    requested_is_night_shift BOOLEAN DEFAULT FALSE,

    -- Request reason and notes
    reason TEXT NOT NULL CHECK (char_length(reason) >= 10 AND char_length(reason) <= 500),
    approval_note TEXT CHECK (approval_note IS NULL OR char_length(approval_note) <= 500),
    rejection_reason TEXT CHECK (rejection_reason IS NULL OR char_length(rejection_reason) BETWEEN 10 AND 500),
    cancellation_reason TEXT CHECK (cancellation_reason IS NULL OR char_length(cancellation_reason) >= 10),

    -- Actor tracking
    approval_employee_id INTEGER REFERENCES employee(id),
    rejection_employee_id INTEGER REFERENCES employee(id),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Add comment
COMMENT ON TABLE stamp_request IS 'Stores stamp correction requests with approval workflow (Requirement 1, 2, 3, 4, 6)';

-- Create indexes for query performance (Requirement 6.1)
-- Index for filtering by employee and status (My Requests page)
CREATE INDEX idx_stamp_request_employee_status ON stamp_request(employee_id, status);

-- Index for filtering by status and creation time (Pending Requests Admin page)
CREATE INDEX idx_stamp_request_status_created ON stamp_request(status, created_at DESC);

-- Partial index for pending requests only (optimizes duplicate detection)
CREATE UNIQUE INDEX idx_stamp_request_pending_unique
    ON stamp_request(employee_id, stamp_history_id)
    WHERE status = 'PENDING';

-- Index for stamp_history_id lookups (status badge queries)
CREATE INDEX idx_stamp_request_stamp_history ON stamp_request(stamp_history_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stamp_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at updates
CREATE TRIGGER trg_stamp_request_updated_at
    BEFORE UPDATE ON stamp_request
    FOR EACH ROW
    EXECUTE FUNCTION update_stamp_request_updated_at();
