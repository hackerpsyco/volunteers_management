-- Add country_code column to volunteers table
ALTER TABLE volunteers
ADD COLUMN country_code VARCHAR(2) DEFAULT 'IN';

-- Add comment for clarity
COMMENT ON COLUMN volunteers.country_code IS 'ISO 3166-1 alpha-2 country code (e.g., IN for India)';
