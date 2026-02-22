-- Diagnostic queries for student_task_feedback table

-- 1. Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'student_task_feedback'
) as table_exists;

-- 2. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'student_task_feedback'
ORDER BY ordinal_position;

-- 3. Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'student_task_feedback';

-- 4. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'student_task_feedback';

-- 5. Count total rows in table
SELECT COUNT(*) as total_rows FROM student_task_feedback;

-- 6. Check for any data
SELECT id, session_id, student_id, task_name, status, created_at
FROM student_task_feedback
LIMIT 10;

-- 7. Check sessions table for reference
SELECT id, title, session_date
FROM sessions
LIMIT 5;

-- 8. Check students table for reference
SELECT id, name
FROM students
LIMIT 5;
