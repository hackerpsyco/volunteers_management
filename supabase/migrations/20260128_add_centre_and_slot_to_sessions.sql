-- Add centre and time slot references to sessions table
ALTER TABLE sessions
ADD COLUMN centre_id UUID REFERENCES centres(id) ON DELETE SET NULL,
ADD COLUMN centre_time_slot_id UUID REFERENCES centre_time_slots(id) ON DELETE SET NULL;

-- Create indexes for faster queries
CREATE INDEX idx_sessions_centre_id ON sessions(centre_id);
CREATE INDEX idx_sessions_centre_time_slot_id ON sessions(centre_time_slot_id);
