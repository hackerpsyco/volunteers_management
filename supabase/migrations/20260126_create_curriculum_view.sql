-- Create a view to display curriculum with all related data
CREATE OR REPLACE VIEW public.curriculum_sessions AS
SELECT 
  sm.id as session_id,
  c.id as category_id,
  c.name as content_category,
  m.id as module_id,
  m.module_code,
  m.title as module_title,
  t.id as topic_id,
  t.topic_code,
  t.title as topic_title,
  t.duration_min,
  t.duration_max,
  sm.status,
  sm.mentor_name,
  sm.mentor_email,
  sm.session_date,
  sm.session_time,
  sm.videos_english,
  sm.videos_hindi,
  sm.worksheets,
  sm.practical_activity,
  sm.quiz_content_ppt,
  sm.final_content_ppt,
  sm.revision_status,
  sm.revision_mentor_name,
  sm.revision_mentor_email,
  sm.revision_date,
  sm.created_at,
  sm.updated_at
FROM public.session_meta sm
JOIN public.topics t ON sm.topic_id = t.id
JOIN public.modules m ON t.module_id = m.id
JOIN public.content_categories c ON m.category_id = c.id
ORDER BY c.name, m.module_code, t.topic_code, sm.session_date DESC;

-- Grant access to authenticated users
GRANT SELECT ON public.curriculum_sessions TO authenticated;
