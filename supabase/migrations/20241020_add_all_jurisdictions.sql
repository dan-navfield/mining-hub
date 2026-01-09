-- Add all Australian jurisdictions to the jurisdiction enum

-- First, add the new values to the enum
ALTER TYPE jurisdiction ADD VALUE IF NOT EXISTS 'NSW';
ALTER TYPE jurisdiction ADD VALUE IF NOT EXISTS 'VIC';
ALTER TYPE jurisdiction ADD VALUE IF NOT EXISTS 'NT';
ALTER TYPE jurisdiction ADD VALUE IF NOT EXISTS 'QLD';
ALTER TYPE jurisdiction ADD VALUE IF NOT EXISTS 'TAS';

-- Update any existing records that might have issues
-- (This is safe to run even if no records exist)
UPDATE tenements SET jurisdiction = 'WA' WHERE jurisdiction IS NULL;

-- Add comment for documentation
COMMENT ON TYPE jurisdiction IS 'Australian mining jurisdictions: WA, NSW, VIC, NT, QLD, TAS';