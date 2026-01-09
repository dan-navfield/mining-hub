-- Fix tenement duplicates by adding unique constraint and cleaning up existing duplicates

-- First, let's create a unique constraint on jurisdiction + number if it doesn't exist
DO $$ 
BEGIN
    -- Check if the unique constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tenements_jurisdiction_number_unique'
    ) THEN
        -- Add unique constraint on jurisdiction + number combination
        ALTER TABLE tenements ADD CONSTRAINT tenements_jurisdiction_number_unique 
        UNIQUE (jurisdiction, number);
        
        RAISE NOTICE 'Added unique constraint on tenements(jurisdiction, number)';
    ELSE
        RAISE NOTICE 'Unique constraint already exists on tenements(jurisdiction, number)';
    END IF;
EXCEPTION
    WHEN duplicate_table THEN
        RAISE NOTICE 'Constraint already exists';
    WHEN others THEN
        RAISE NOTICE 'Error adding constraint: %', SQLERRM;
END $$;

-- Clean up any existing duplicates by keeping only the most recent record for each jurisdiction+number
WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY jurisdiction, number 
               ORDER BY last_sync_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
           ) as rn
    FROM tenements
)
DELETE FROM tenements 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Add an index to improve performance on jurisdiction + number lookups
CREATE INDEX IF NOT EXISTS idx_tenements_jurisdiction_number 
ON tenements(jurisdiction, number);

-- Update the record count display query to be more accurate
CREATE OR REPLACE VIEW tenement_stats AS
SELECT 
    jurisdiction,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'Current' OR status = 'Live' THEN 1 END) as active_records,
    MAX(last_sync_at) as last_sync,
    MIN(created_at) as first_created
FROM tenements 
GROUP BY jurisdiction;

COMMENT ON VIEW tenement_stats IS 'Provides accurate tenement statistics by jurisdiction without duplicates';
