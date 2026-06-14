ALTER TABLE public.student_task_feedback ADD COLUMN IF NOT EXISTS submission_types text[] DEFAULT '{code}';
