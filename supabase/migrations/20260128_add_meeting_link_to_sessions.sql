-- Add meeting_link column to sessions table
ALTER TABLE sessions
ADD COLUMN meeting_link TEXT;

-- Create index for faster queries
CREATE INDEX idx_sessions_meeting_link ON sessions(meeting_link);
