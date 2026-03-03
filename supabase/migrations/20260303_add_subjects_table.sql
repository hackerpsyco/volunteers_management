-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add subject_id column to curriculum table
ALTER TABLE curriculum ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;

-- Insert default subjects
INSERT INTO subjects (name, description) VALUES
  ('AI', 'Artificial Intelligence'),
  ('Computer', 'Computer Science'),
  ('Eng & Com', 'English & Communication'),
  ('Soft Skills', 'Soft Skills Development')
ON CONFLICT (name) DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_curriculum_subject_id ON curriculum(subject_id);
