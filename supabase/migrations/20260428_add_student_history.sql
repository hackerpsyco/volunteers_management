-- Add joining_year and promotion_history to students
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS joining_year text,
ADD COLUMN IF NOT EXISTS promotion_history jsonb DEFAULT '[]'::jsonb;
