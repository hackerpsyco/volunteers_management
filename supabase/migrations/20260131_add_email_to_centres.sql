-- Add email column back to centres table
ALTER TABLE centres
ADD COLUMN IF NOT EXISTS email TEXT;

