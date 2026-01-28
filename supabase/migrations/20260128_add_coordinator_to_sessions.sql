-- Add coordinator_name column to sessions table
ALTER TABLE sessions ADD COLUMN coordinator_name VARCHAR(255);

-- Create index for faster queries
CREATE INDEX idx_sessions_coordinator_name ON sessions(coordinator_name);
