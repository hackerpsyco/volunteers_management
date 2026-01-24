-- Add new columns to volunteers table
ALTER TABLE public.volunteers 
ADD COLUMN IF NOT EXISTS organization_type text NOT NULL DEFAULT 'company',
ADD COLUMN IF NOT EXISTS organization_name text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS personal_email text,
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Rename email to work_email for clarity
ALTER TABLE public.volunteers RENAME COLUMN email TO work_email;

-- Migrate existing company data to organization_name
UPDATE public.volunteers SET organization_name = company WHERE company IS NOT NULL;

-- Drop the old company column
ALTER TABLE public.volunteers DROP COLUMN IF EXISTS company;