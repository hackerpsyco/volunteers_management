-- Migration to add volunteer_id column to public.volunteers table and populate existing rows

ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS volunteer_id TEXT;

-- Update existing rows using formula: Volunteer Name + Company (first 2 chars) + City + Role Short (GT/GS/LT)
WITH formatted_volunteers AS (
  SELECT 
    id,
    CONCAT(
      TRIM(name),
      '-',
      UPPER(
        CASE 
          WHEN organization_type = 'individual' THEN 'SE'
          WHEN organization_name IS NOT NULL AND TRIM(organization_name) != '' THEN SUBSTRING(TRIM(organization_name) FROM 1 FOR 2)
          ELSE 'NA'
        END
      ),
      '-',
      COALESCE(NULLIF(INITCAP(TRIM(city)), ''), 'NA'),
      '-',
      CASE 
        WHEN LOWER(COALESCE(preference, '')) LIKE '%speaker%' THEN 'GS'
        WHEN LOWER(COALESCE(preference, '')) LIKE '%local%' THEN 'LT'
        ELSE 'GT'
      END
    ) AS generated_vid
  FROM public.volunteers
)
UPDATE public.volunteers v
SET volunteer_id = f.generated_vid
FROM formatted_volunteers f
WHERE v.id = f.id;
