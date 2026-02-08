-- Add class_id to curriculum table to link curriculum to specific classes
ALTER TABLE public.curriculum ADD COLUMN class_id UUID REFERENCES classes(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_curriculum_class_id ON public.curriculum(class_id);

-- Update RLS policies to include class-based filtering if needed
-- (existing policies already allow access, this is just for organization)
