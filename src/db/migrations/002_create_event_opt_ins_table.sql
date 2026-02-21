-- Up Migration

CREATE TABLE IF NOT EXISTS event_opt_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    consent BOOLEAN NOT NULL CHECK (consent = true),
    event_id VARCHAR(24) NOT NULL, -- Storing MongoDB ObjectId as a 24-character hex string
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_opt_ins_email ON event_opt_ins(email);

-- Index on event_id could also be useful depending on query patterns
CREATE INDEX IF NOT EXISTS idx_event_opt_ins_event_id ON event_opt_ins(event_id);

-- Down Migration (for reference/rollback)
/*
DROP INDEX IF EXISTS idx_event_opt_ins_event_id;
DROP INDEX IF EXISTS idx_event_opt_ins_email;
DROP TABLE IF EXISTS event_opt_ins;
*/
