-- Migration to decouple attendance status from performance comments
ALTER TABLE public.student_performance 
ADD COLUMN IF NOT EXISTS attendance_status text DEFAULT 'Present';

-- Initialize attendance_status based on existing performance_comment values
UPDATE public.student_performance 
SET attendance_status = 'Absent' 
WHERE performance_comment = 'Absent';

UPDATE public.student_performance 
SET attendance_status = 'Present' 
WHERE performance_comment IS NULL OR performance_comment = 'Present' OR (performance_comment != 'Absent' AND attendance_status = 'Present');

-- If performance_comment was 'Present', we can clear it as it's now in attendance_status
UPDATE public.student_performance 
SET performance_comment = NULL 
WHERE performance_comment = 'Present' OR performance_comment = 'Absent';
