-- Add geometry column to store full polygon/geometry data from government APIs
-- This will store the raw geometry data in its native format per jurisdiction

ALTER TABLE tenements 
ADD COLUMN geometry JSONB;

-- Add index for geometry queries
CREATE INDEX idx_tenements_geometry ON tenements USING GIN (geometry);

-- Add comment
COMMENT ON COLUMN tenements.geometry IS 'Full geometry data from government APIs (polygons, points, etc.) in native format per jurisdiction';
