-- Update sessions table to have correct columns
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS facilitator_name TEXT;

-- Drop old columns if they exist
ALTER TABLE public.sessions
DROP COLUMN IF EXISTS guest_speaker,
DROP COLUMN IF EXISTS guest_teacher,
DROP COLUMN IF EXISTS volunteer_name,
DROP COLUMN IF EXISTS mentor_email;
