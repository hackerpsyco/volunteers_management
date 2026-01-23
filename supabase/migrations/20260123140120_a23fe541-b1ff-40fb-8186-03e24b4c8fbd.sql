-- Add new columns to volunteers table
ALTER TABLE public.volunteers 
ADD COLUMN company text,
ADD COLUMN city text,
ADD COLUMN linkedin_profile text;

-- Rename mobile to number for consistency
ALTER TABLE public.volunteers RENAME COLUMN mobile TO phone_number;