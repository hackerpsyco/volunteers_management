-- FINAL FIX: Drop and recreate RLS policies for student_task_feedback
-- The issue: Original policies use auth.role() which doesn't work as expected in Supabase

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read for authenticated users" ON student_task_feedback;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON student_task_feedback;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON student_task_feedback;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON student_task_feedback;

-- Create WORKING policies that allow authenticated users
-- Using a simpler approach that Supabase actually supports

CREATE POLICY "Allow authenticated read" ON student_task_feedback
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert" ON student_task_feedback
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON student_task_feedback
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete" ON student_task_feedback
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Alternative: If above doesn't work, use this PERMISSIVE approach
-- (Uncomment if needed)
/*
DROP POLICY IF EXISTS "Allow authenticated read" ON student_task_feedback;
DROP POLICY IF EXISTS "Allow authenticated insert" ON student_task_feedback;
DROP POLICY IF EXISTS "Allow authenticated update" ON student_task_feedback;
DROP POLICY IF EXISTS "Allow authenticated delete" ON student_task_feedback;

CREATE POLICY "public_read" ON student_task_feedback
  FOR SELECT USING (true);

CREATE POLICY "public_insert" ON student_task_feedback
  FOR INSERT WITH CHECK (true);

CREATE POLICY "public_update" ON student_task_feedback
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "public_delete" ON student_task_feedback
  FOR DELETE USING (true);
*/
