-- Simple Curriculum Table
-- Single table design for easy management and querying

CREATE TABLE IF NOT EXISTS public.curriculum (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  content_category TEXT NOT NULL,
  module_no INTEGER,
  module_name TEXT,
  topics_covered TEXT NOT NULL,
  
  -- Resources
  videos TEXT,
  quiz_content_ppt TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_curriculum_category ON public.curriculum(content_category);
CREATE INDEX idx_curriculum_module_no ON public.curriculum(module_no);
CREATE INDEX idx_curriculum_topics ON public.curriculum(topics_covered);

-- Enable Row Level Security
ALTER TABLE public.curriculum ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow authenticated users full access
CREATE POLICY "Allow authenticated users to read curriculum"
  ON public.curriculum FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert curriculum"
  ON public.curriculum FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update curriculum"
  ON public.curriculum FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete curriculum"
  ON public.curriculum FOR DELETE TO authenticated USING (true);
