-- Add coordinator quality rating columns to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS coordinator_mic_sound_rating INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS coordinator_seating_view_rating INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS coordinator_session_strength INTEGER DEFAULT 5;

-- Add constraints to ensure ratings are between 1-10
ALTER TABLE sessions
ADD CONSTRAINT coordinator_mic_sound_rating_check CHECK (coordinator_mic_sound_rating >= 1 AND coordinator_mic_sound_rating <= 10),
ADD CONSTRAINT coordinator_seating_view_rating_check CHECK (coordinator_seating_view_rating >= 1 AND coordinator_seating_view_rating <= 10),
ADD CONSTRAINT coordinator_session_strength_check CHECK (coordinator_session_strength >= 1 AND coordinator_session_strength <= 10);
