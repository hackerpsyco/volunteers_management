-- Add location and bio columns to students table if they don't already exist
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;
