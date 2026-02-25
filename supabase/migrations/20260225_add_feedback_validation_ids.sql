-- Add validation ID columns to sessions table for coordinator feedback
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS guest_teacher_feedback_valid_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS incharge_reviewer_feedback_valid_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS recording_url_valid_id VARCHAR(50);

-- Add check constraints for valid values
ALTER TABLE sessions
ADD CONSTRAINT guest_teacher_feedback_valid_id_check CHECK (guest_teacher_feedback_valid_id IN ('', 'valid', 'pending', 'invalid', NULL)),
ADD CONSTRAINT incharge_reviewer_feedback_valid_id_check CHECK (incharge_reviewer_feedback_valid_id IN ('', 'valid', 'pending', 'invalid', NULL)),
ADD CONSTRAINT recording_url_valid_id_check CHECK (recording_url_valid_id IN ('', 'valid', 'pending', 'invalid', NULL));
