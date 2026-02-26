-- Add facilitator quality rating columns to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS mic_sound_rating INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS seating_view_rating INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS session_strength INTEGER DEFAULT 5;

-- Add constraints to ensure ratings are between 1-10
ALTER TABLE sessions
ADD CONSTRAINT mic_sound_rating_check CHECK (mic_sound_rating >= 1 AND mic_sound_rating <= 10),
ADD CONSTRAINT seating_view_rating_check CHECK (seating_view_rating >= 1 AND seating_view_rating <= 10),
ADD CONSTRAINT session_strength_check CHECK (session_strength >= 1 AND session_strength <= 10);
