-- Remove phone and email columns from centres table
ALTER TABLE centres
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS email;
