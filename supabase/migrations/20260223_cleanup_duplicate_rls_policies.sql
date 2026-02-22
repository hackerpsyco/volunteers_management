-- CLEANUP: Remove ALL duplicate RLS policies and keep only ONE clean set

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Allow admins full access" ON student_task_feedback;
DROP POLICY IF EXISTS "Allow authenticated delete" ON student_task_feedback;
DROP POLICY IF EXISTS "Allow authenticated insert" ON student_task_feedback;
DROP POLICY IF EXISTS "Allow authenticated read" ON student_task_feedback;
DROP POLICY IF EXISTS "Allow authenticated update" ON student_task_feedback;
DROP POLICY IF EXISTS "Allow authenticated users to delete own records" ON student_task_feedback;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON student_task_feedback;
DROP POLICY IF EXISTS "Allow authenticated users to read" ON student_task_feedback;
DROP POLICY IF EXISTS "Allow authenticated users to update own records" ON student_task_feedback;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON student_task_feedback;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON student_task_feedback;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON student_task_feedback;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON student_task_feedback;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON student_task_feedback;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON student_task_feedback;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON student_task_feedback;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON student_task_feedback;

-- Create ONE CLEAN SET of policies
-- These allow all authenticated users full access to all records

CREATE POLICY "select_all" ON student_task_feedback
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "insert_all" ON student_task_feedback
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "update_all" ON student_task_feedback
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "delete_all" ON student_task_feedback
  FOR DELETE
  USING (auth.role() = 'authenticated');
