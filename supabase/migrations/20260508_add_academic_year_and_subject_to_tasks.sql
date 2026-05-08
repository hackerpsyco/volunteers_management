-- Migration: Add academic_year and subject_id to tasks
-- Allows tasks to be filtered by academic year and associated with subjects

ALTER TABLE public.student_task_feedback 
ADD COLUMN IF NOT EXISTS academic_year TEXT,
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_task_feedback_academic_year ON public.student_task_feedback(academic_year);
CREATE INDEX IF NOT EXISTS idx_student_task_feedback_subject_id ON public.student_task_feedback(subject_id);

-- Update existing tasks to the default academic year (2025-26) so they show up in the UI
UPDATE public.student_task_feedback SET academic_year = '2025-26' WHERE academic_year IS NULL;
