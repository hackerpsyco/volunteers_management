-- Create Sessions Table
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Session Info
  title TEXT NOT NULL,
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  session_type TEXT DEFAULT 'guest_teacher',
  status TEXT DEFAULT 'pending',
  
  -- Volunteer/Guest Info
  guest_teacher TEXT,
  mentor_email TEXT,
  
  -- Content Info
  content_category TEXT,
  module_no INTEGER,
  module_name TEXT,
  topics_covered TEXT,
  
  -- Resources
  videos TEXT,
  quiz_content_ppt TEXT,
  final_content_ppt TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_sessions_date ON public.sessions(session_date);
CREATE INDEX idx_sessions_status ON public.sessions(status);
CREATE INDEX idx_sessions_category ON public.sessions(content_category);
CREATE INDEX idx_sessions_volunteer ON public.sessions(guest_teacher);

-- Enable Row Level Security
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow authenticated users full access
CREATE POLICY "Allow authenticated users to read sessions"
  ON public.sessions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert sessions"
  ON public.sessions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update sessions"
  ON public.sessions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete sessions"
  ON public.sessions FOR DELETE TO authenticated USING (true);
