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

-- Delete all old subjects first
DELETE FROM subjects;

-- Insert new subjects
INSERT INTO subjects (name, description) VALUES
  ('AI', 'Artificial Intelligence'),
  ('Computers Fundamentals', 'Computer Fundamentals'),
  ('Communication and Soft Skills', 'Communication and Soft Skills');

-- Assign all curriculum items to AI subject
UPDATE curriculum
SET subject_id = (SELECT id FROM subjects WHERE name = 'AI')
WHERE subject_id IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_curriculum_subject_id ON curriculum(subject_id);
