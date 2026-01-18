-- Add coordinates column to tenements table for map display
-- This will store [longitude, latitude] as a JSON array

ALTER TABLE tenements 
ADD COLUMN coordinates JSONB;

-- Add index for coordinates queries
CREATE INDEX idx_tenements_coordinates ON tenements USING GIN (coordinates);

-- Add comment
COMMENT ON COLUMN tenements.coordinates IS 'Coordinates stored as [longitude, latitude] array for map display';
