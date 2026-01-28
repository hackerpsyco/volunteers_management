-- Fix RLS Policies for Curriculum Table
-- This ensures DELETE operations work properly

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read curriculum" ON public.curriculum;
DROP POLICY IF EXISTS "Allow authenticated users to insert curriculum" ON public.curriculum;
DROP POLICY IF EXISTS "Allow authenticated users to update curriculum" ON public.curriculum;
DROP POLICY IF EXISTS "Allow authenticated users to delete curriculum" ON public.curriculum;

-- Ensure RLS is enabled
ALTER TABLE public.curriculum ENABLE ROW LEVEL SECURITY;

-- Create new policies with explicit permissions
CREATE POLICY "curriculum_select_policy"
  ON public.curriculum FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "curriculum_insert_policy"
  ON public.curriculum FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "curriculum_update_policy"
  ON public.curriculum FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "curriculum_delete_policy"
  ON public.curriculum FOR DELETE
  TO authenticated
  USING (true);

-- Also allow anon users if needed (for public access)
CREATE POLICY "curriculum_select_anon"
  ON public.curriculum FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "curriculum_insert_anon"
  ON public.curriculum FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "curriculum_update_anon"
  ON public.curriculum FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "curriculum_delete_anon"
  ON public.curriculum FOR DELETE
  TO anon
  USING (true);
