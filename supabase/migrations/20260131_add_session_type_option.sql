-- Add session_type_option column to distinguish between Fresh/Revision sessions
-- This is separate from session_type which may be used for other purposes

ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS session_type_option TEXT DEFAULT 'fresh';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sessions_type_option ON public.sessions(session_type_option);

-- Add comment to explain the column
COMMENT ON COLUMN public.sessions.session_type_option IS 'Session type: fresh or revision';
