-- Add volunteer_name column to sessions table
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS volunteer_name TEXT;

-- Update RLS policies to allow all users to read and write
DROP POLICY IF EXISTS "Allow all users to read sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow all users to insert sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow all users to update sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow all users to delete sessions" ON public.sessions;

CREATE POLICY "Allow all users to read sessions"
ON public.sessions FOR SELECT
USING (true);

CREATE POLICY "Allow all users to insert sessions"
ON public.sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow all users to update sessions"
ON public.sessions FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all users to delete sessions"
ON public.sessions FOR DELETE
USING (true);
