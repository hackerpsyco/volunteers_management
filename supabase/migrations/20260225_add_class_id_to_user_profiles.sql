-- Add class_id column to user_profiles table to link students to their class
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_class_id ON user_profiles(class_id);
