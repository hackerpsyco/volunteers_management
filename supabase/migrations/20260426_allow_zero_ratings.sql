-- Migration to allow 0 in ratings
ALTER TABLE public.student_performance 
DROP CONSTRAINT IF EXISTS student_performance_performance_rating_check;

ALTER TABLE public.student_performance 
ADD CONSTRAINT student_performance_performance_rating_check 
CHECK (performance_rating >= 0 AND performance_rating <= 10);

-- Also update session level ratings just in case
ALTER TABLE public.sessions 
DROP CONSTRAINT IF EXISTS sessions_coordinator_mic_sound_rating_check,
DROP CONSTRAINT IF EXISTS sessions_coordinator_seating_view_rating_check,
DROP CONSTRAINT IF EXISTS sessions_coordinator_session_strength_check;

ALTER TABLE public.sessions 
ADD CONSTRAINT sessions_coordinator_mic_sound_rating_check CHECK (coordinator_mic_sound_rating >= 0 AND coordinator_mic_sound_rating <= 10),
ADD CONSTRAINT sessions_coordinator_seating_view_rating_check CHECK (coordinator_seating_view_rating >= 0 AND coordinator_seating_view_rating <= 10),
ADD CONSTRAINT sessions_coordinator_session_strength_check CHECK (coordinator_session_strength >= 0 AND coordinator_session_strength <= 10);
