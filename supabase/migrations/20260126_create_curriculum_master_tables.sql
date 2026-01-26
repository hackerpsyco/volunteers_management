-- Create ContentCategory Master Table
CREATE TABLE IF NOT EXISTS public.content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Module Master Table
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.content_categories(id) ON DELETE CASCADE,
  module_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, module_code)
);

-- Create Topic Master Table
CREATE TABLE IF NOT EXISTS public.topics (
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

-- Create SessionMeta Table (for session-specific data)
CREATE TABLE IF NOT EXISTS public.session_meta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  mentor_name TEXT,
  mentor_email TEXT,
  session_date DATE,
  session_time TIME,
  videos_english TEXT,
  videos_hindi TEXT,
  worksheets TEXT,
  practical_activity TEXT,
  quiz_content_ppt TEXT,
  final_content_ppt TEXT,
  revision_status TEXT,
  revision_mentor_name TEXT,
  revision_mentor_email TEXT,
  revision_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_modules_category_id ON public.modules(category_id);
CREATE INDEX idx_topics_module_id ON public.topics(module_id);
CREATE INDEX idx_session_meta_topic_id ON public.session_meta(topic_id);
CREATE INDEX idx_session_meta_status ON public.session_meta(status);
CREATE INDEX idx_session_meta_session_date ON public.session_meta(session_date);

-- Add RLS policies
ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_meta ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read content_categories"
  ON public.content_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read modules"
  ON public.modules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read topics"
  ON public.topics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read session_meta"
  ON public.session_meta FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert content_categories"
  ON public.content_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert modules"
  ON public.modules FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert topics"
  ON public.topics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert session_meta"
  ON public.session_meta FOR INSERT
  TO authenticated
  WITH CHECK (true);
