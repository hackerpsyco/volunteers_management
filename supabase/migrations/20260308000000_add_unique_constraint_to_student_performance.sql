-- Migration to deduplicate and prevent duplicate student performance records
-- 1. First, delete duplicates, keeping only the most recent entry for each student in each session
DELETE FROM public.student_performance a
USING public.student_performance b
WHERE a.id < b.id 
  AND a.session_id = b.session_id 
  AND a.student_name = b.student_name;

-- 2. Now add the unique constraint to prevent future duplicates
ALTER TABLE public.student_performance 
ADD CONSTRAINT student_performance_session_id_student_name_key UNIQUE (session_id, student_name);
