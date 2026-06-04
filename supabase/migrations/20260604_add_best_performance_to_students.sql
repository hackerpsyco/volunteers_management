-- Add best_performance_dates to students table to track best performer tags
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS best_performance_dates jsonb DEFAULT '[]'::jsonb;
