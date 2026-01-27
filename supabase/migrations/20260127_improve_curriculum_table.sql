-- Drop the old curriculum table if it exists
DROP TABLE IF EXISTS public.curriculum CASCADE;

-- Improved Curriculum Table
-- Each row from Excel will be a separate record
-- No unique constraints on content_category or module_no to allow duplicates

CREATE TABLE public.curriculum (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information (can have duplicates across rows)
  content_category TEXT,
  module_no INTEGER,
  module_name TEXT,
  topics_covered TEXT NOT NULL,  -- This is unique per row
  
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

-- Add comment to explain the design
COMMENT ON TABLE public.curriculum IS 'Curriculum table where each row represents a unique topic. Content Category and Module No can repeat across multiple rows for sub-topics.';
