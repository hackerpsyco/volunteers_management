-- Add session recording and feedback fields to sessions table
ALTER TABLE sessions
ADD COLUMN session_objective TEXT,
ADD COLUMN practical_activities TEXT,
ADD COLUMN session_highlights TEXT,
ADD COLUMN learning_outcomes TEXT,
ADD COLUMN facilitator_reflection TEXT,
ADD COLUMN best_performer TEXT,
ADD COLUMN guest_teacher_feedback TEXT,
ADD COLUMN incharge_reviewer_feedback TEXT,
ADD COLUMN mic_sound_rating INTEGER,
ADD COLUMN seating_view_rating INTEGER,
ADD COLUMN session_strength INTEGER,
ADD COLUMN class_batch VARCHAR(255),
ADD COLUMN guest_teacher_id UUID REFERENCES facilitators(id) ON DELETE SET NULL,
ADD COLUMN recorded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create indexes for faster queries
CREATE INDEX idx_sessions_guest_teacher_id ON sessions(guest_teacher_id);
CREATE INDEX idx_sessions_recorded_by ON sessions(recorded_by);
CREATE INDEX idx_sessions_recorded_at ON sessions(recorded_at);
