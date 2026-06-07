-- Migration: Add bad_behaviour_points to student_performance table
ALTER TABLE public.student_performance 
ADD COLUMN IF NOT EXISTS bad_behaviour_points integer DEFAULT 0 CHECK (bad_behaviour_points >= 0 AND bad_behaviour_points <= 10);
