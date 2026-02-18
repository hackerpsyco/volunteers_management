-- Add email column to classes table
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS email TEXT;
