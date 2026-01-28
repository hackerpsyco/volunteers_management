-- Fix RLS Policies for Sessions Table
-- This ensures all columns can be inserted/updated properly

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow authenticated users to insert sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow authenticated users to update sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow authenticated users to delete sessions" ON public.sessions;

-- Ensure RLS is enabled
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Create new policies with explicit permissions
CREATE POLICY "sessions_select_policy"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "sessions_insert_policy"
  ON public.sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "sessions_update_policy"
  ON public.sessions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "sessions_delete_policy"
  ON public.sessions FOR DELETE
  TO authenticated
  USING (true);

-- Also allow anon users if needed (for public access)
CREATE POLICY "sessions_select_anon"
  ON public.sessions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "sessions_insert_anon"
  ON public.sessions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "sessions_update_anon"
  ON public.sessions FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "sessions_delete_anon"
  ON public.sessions FOR DELETE
  TO anon
  USING (true);
