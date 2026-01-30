-- Add new columns to volunteers table for preferences and volunteering details
ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS regular_volunteering boolean DEFAULT false;
ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS frequency_per_month integer;
ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS interested_area text;
ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS interested_topic text;
ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS preferred_day text;
ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS preferred_class text;
ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS remarks text;
ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS volunteer_status text DEFAULT 'active';
