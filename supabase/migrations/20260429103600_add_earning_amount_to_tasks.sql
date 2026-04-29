-- Migration: add_earning_amount_to_tasks
-- Description: Adds earning_amount column to student_task_feedback table to allow dynamic earnings per task

ALTER TABLE public.student_task_feedback 
ADD COLUMN IF NOT EXISTS earning_amount numeric DEFAULT 5;
