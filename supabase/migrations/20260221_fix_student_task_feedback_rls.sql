-- Fix RLS policies for student_task_feedback table
-- Drop existing policies
DROP POLICY IF EXISTS "Enable read for authenticated users" ON student_task_feedback;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON student_task_feedback;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON student_task_feedback;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON student_task_feedback;

-- Create more permissive RLS policies
CREATE POLICY "Allow authenticated users to read" ON student_task_feedback
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert" ON student_task_feedback
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND created_by = auth.uid());

CREATE POLICY "Allow authenticated users to update own records" ON student_task_feedback
  FOR UPDATE USING (auth.role() = 'authenticated' AND created_by = auth.uid());

CREATE POLICY "Allow authenticated users to delete own records" ON student_task_feedback
  FOR DELETE USING (auth.role() = 'authenticated' AND created_by = auth.uid());

-- Also allow admins to do everything
CREATE POLICY "Allow admins full access" ON student_task_feedback
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role_id = 1
    )
  );
