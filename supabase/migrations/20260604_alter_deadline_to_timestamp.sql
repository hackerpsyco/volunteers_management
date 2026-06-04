-- Alter deadline column to timestamp with time zone in student_task_feedback
ALTER TABLE public.student_task_feedback 
ALTER COLUMN deadline TYPE timestamp with time zone;
