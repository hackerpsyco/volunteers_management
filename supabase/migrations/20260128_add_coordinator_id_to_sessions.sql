-- Add coordinator_id column to sessions table
ALTER TABLE sessions
ADD COLUMN coordinator_id UUID REFERENCES coordinators(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_sessions_coordinator_id ON sessions(coordinator_id);
