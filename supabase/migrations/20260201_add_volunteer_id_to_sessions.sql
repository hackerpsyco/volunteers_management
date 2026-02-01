-- Add volunteer_id column to sessions table to properly link volunteers
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS volunteer_id UUID REFERENCES volunteers(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sessions_volunteer_id ON public.sessions(volunteer_id);

-- Add comment for clarity
COMMENT ON COLUMN public.sessions.volunteer_id IS 'Foreign key reference to the volunteer assigned to this session';
