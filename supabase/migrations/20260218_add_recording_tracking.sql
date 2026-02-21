-- Add recording tracking columns to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS recording_url TEXT,
ADD COLUMN IF NOT EXISTS recording_status TEXT DEFAULT 'pending', -- pending, available, failed
ADD COLUMN IF NOT EXISTS recording_duration INTEGER, -- in seconds
ADD COLUMN IF NOT EXISTS recording_size TEXT, -- file size
ADD COLUMN IF NOT EXISTS recording_created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS google_event_id TEXT; -- Google Calendar event ID for webhook matching
