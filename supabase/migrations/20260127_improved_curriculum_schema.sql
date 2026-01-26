-- Drop old tables and views
DROP VIEW IF EXISTS public.curriculum_sessions CASCADE;
DROP TABLE IF EXISTS public.session_meta CASCADE;
DROP TABLE IF EXISTS public.topics CASCADE;
DROP TABLE IF EXISTS public.modules CASCADE;
DROP TABLE IF EXISTS public.content_categories CASCADE;

-- ============================================
-- IMPROVED CURRICULUM SCHEMA
-- ============================================

-- 1. Content Categories (Master)
CREATE TABLE public.content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Modules (Master)
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.content_categories(id) ON DELETE CASCADE,
  module_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, module_code)
);

-- 3. Topics (Master)
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  topic_code TEXT NOT NULL,
  title TEXT NOT NULL,
  duration_min INTEGER,
  duration_max INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(module_id, topic_code)
);

-- 4. Topic Sessions (Status-based organization)
-- One topic can have multiple sessions with different statuses
CREATE TABLE public.topic_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'available', 'completed', 'committed')),
  
  -- Session Information
  mentor_name TEXT,
  mentor_email TEXT,
  session_date DATE,
  session_time TIME,
  
  -- Resources (English)
  video_english TEXT,
  worksheet_english TEXT,
  practical_activity_english TEXT,
  
  -- Resources (Hindi)
  video_hindi TEXT,
  worksheet_hindi TEXT,
  practical_activity_hindi TEXT,
  
  -- Content
  quiz_content_ppt TEXT,
  final_content_ppt TEXT,
  
  -- Revision Information
  revision_status TEXT CHECK (revision_status IN ('pending', 'available', 'completed', 'committed', NULL)),
  revision_mentor_name TEXT,
  revision_mentor_email TEXT,
  revision_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_modules_category_id ON public.modules(category_id);
CREATE INDEX idx_topics_module_id ON public.topics(module_id);
CREATE INDEX idx_topic_sessions_topic_id ON public.topic_sessions(topic_id);
CREATE INDEX idx_topic_sessions_status ON public.topic_sessions(status);
CREATE INDEX idx_topic_sessions_session_date ON public.topic_sessions(session_date);
CREATE INDEX idx_topic_sessions_mentor_name ON public.topic_sessions(mentor_name);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_sessions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all
CREATE POLICY "Allow authenticated users to read content_categories"
  ON public.content_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read modules"
  ON public.modules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read topics"
  ON public.topics FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read topic_sessions"
  ON public.topic_sessions FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert content_categories"
  ON public.content_categories FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert modules"
  ON public.modules FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert topics"
  ON public.topics FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert topic_sessions"
  ON public.topic_sessions FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated users to delete topic_sessions"
  ON public.topic_sessions FOR DELETE TO authenticated USING (true);

-- ============================================
-- VIEWS FOR EASY QUERYING
-- ============================================

-- View 1: All curriculum organized by category → module → topic → status
CREATE OR REPLACE VIEW public.curriculum_by_status AS
SELECT 
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
  ts.id as session_id,
  ts.status,
  ts.mentor_name,
  ts.mentor_email,
  ts.session_date,
  ts.session_time,
  ts.video_english,
  ts.worksheet_english,
  ts.practical_activity_english,
  ts.video_hindi,
  ts.worksheet_hindi,
  ts.practical_activity_hindi,
  ts.quiz_content_ppt,
  ts.final_content_ppt,
  ts.revision_status,
  ts.revision_mentor_name,
  ts.revision_mentor_email,
  ts.revision_date,
  ts.created_at,
  ts.updated_at
FROM public.topic_sessions ts
JOIN public.topics t ON ts.topic_id = t.id
JOIN public.modules m ON t.module_id = m.id
JOIN public.content_categories c ON m.category_id = c.id
ORDER BY c.name, m.module_code, t.topic_code, ts.status;

-- View 2: Status summary by category
CREATE OR REPLACE VIEW public.status_summary_by_category AS
SELECT 
  c.name as content_category,
  ts.status,
  COUNT(*) as count
FROM public.topic_sessions ts
JOIN public.topics t ON ts.topic_id = t.id
JOIN public.modules m ON t.module_id = m.id
JOIN public.content_categories c ON m.category_id = c.id
GROUP BY c.name, ts.status
ORDER BY c.name, ts.status;

-- View 3: Status summary by module
CREATE OR REPLACE VIEW public.status_summary_by_module AS
SELECT 
  c.name as content_category,
  m.module_code,
  m.title as module_title,
  ts.status,
  COUNT(*) as count
FROM public.topic_sessions ts
JOIN public.topics t ON ts.topic_id = t.id
JOIN public.modules m ON t.module_id = m.id
JOIN public.content_categories c ON m.category_id = c.id
GROUP BY c.name, m.module_code, m.title, ts.status
ORDER BY c.name, m.module_code, ts.status;

-- Grant access to views
GRANT SELECT ON public.curriculum_by_status TO authenticated;
GRANT SELECT ON public.status_summary_by_category TO authenticated;
GRANT SELECT ON public.status_summary_by_module TO authenticated;
