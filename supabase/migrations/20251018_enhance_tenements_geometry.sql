-- Enhance tenements table to support real geometric data from government sources
-- This migration adds proper geometry support, coordinate systems, and data source tracking

-- Enable PostGIS extension for geometric operations
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geometry columns to tenements table
ALTER TABLE tenements 
ADD COLUMN IF NOT EXISTS geometry GEOMETRY(GEOMETRY, 4326), -- WGS84 for web mapping
ADD COLUMN IF NOT EXISTS geometry_simplified GEOMETRY(GEOMETRY, 4326), -- Simplified for performance
ADD COLUMN IF NOT EXISTS centroid GEOMETRY(POINT, 4326), -- Center point for markers
ADD COLUMN IF NOT EXISTS bbox GEOMETRY(POLYGON, 4326), -- Bounding box for quick spatial queries
ADD COLUMN IF NOT EXISTS original_crs TEXT, -- Original coordinate reference system
ADD COLUMN IF NOT EXISTS geometry_source TEXT, -- Source of geometry data
ADD COLUMN IF NOT EXISTS geometry_quality TEXT DEFAULT 'surveyed', -- surveyed, unsurveyed, approximate
ADD COLUMN IF NOT EXISTS data_source_url TEXT, -- URL of the original dataset
ADD COLUMN IF NOT EXISTS data_source_name TEXT, -- Name of the data source
ADD COLUMN IF NOT EXISTS last_geometry_update TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS geometry_metadata JSONB; -- Additional metadata from source

-- Create spatial indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenements_geometry ON tenements USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_tenements_geometry_simplified ON tenements USING GIST (geometry_simplified);
CREATE INDEX IF NOT EXISTS idx_tenements_centroid ON tenements USING GIST (centroid);
CREATE INDEX IF NOT EXISTS idx_tenements_bbox ON tenements USING GIST (bbox);

-- Create index on data source for filtering
CREATE INDEX IF NOT EXISTS idx_tenements_data_source ON tenements (data_source_name);
CREATE INDEX IF NOT EXISTS idx_tenements_geometry_quality ON tenements (geometry_quality);

-- Add constraint to ensure valid geometries
ALTER TABLE tenements 
ADD CONSTRAINT check_geometry_valid 
CHECK (geometry IS NULL OR ST_IsValid(geometry));

-- Create function to automatically update centroid and bbox when geometry changes
CREATE OR REPLACE FUNCTION update_tenement_spatial_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Update centroid if geometry exists
    IF NEW.geometry IS NOT NULL THEN
        NEW.centroid = ST_Centroid(NEW.geometry);
        NEW.bbox = ST_Envelope(NEW.geometry);
        NEW.last_geometry_update = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update spatial fields
DROP TRIGGER IF EXISTS trigger_update_tenement_spatial_fields ON tenements;
CREATE TRIGGER trigger_update_tenement_spatial_fields
    BEFORE INSERT OR UPDATE OF geometry ON tenements
    FOR EACH ROW
    EXECUTE FUNCTION update_tenement_spatial_fields();

-- Create table for tracking data source metadata
CREATE TABLE IF NOT EXISTS tenement_data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    jurisdiction TEXT NOT NULL,
    description TEXT,
    url TEXT,
    format TEXT, -- GeoJSON, SHP, WFS, etc.
    update_frequency TEXT, -- daily, weekly, monthly
    last_updated TIMESTAMPTZ,
    last_sync_attempt TIMESTAMPTZ,
    last_sync_success TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'pending', -- pending, running, success, error
    sync_error TEXT,
    record_count INTEGER DEFAULT 0,
    license_info TEXT,
    coordinate_system TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert known data sources
INSERT INTO tenement_data_sources (name, jurisdiction, description, url, format, update_frequency, coordinate_system, license_info) VALUES
('WA DMIRS-003', 'WA', 'Mining Tenements from Department of Energy, Mines, Industry Regulation and Safety', 'https://catalogue.data.wa.gov.au/dataset/mining-tenements-dmirs-003', 'GeoJSON/SHP', 'weekly', 'GDA2020', 'Creative Commons'),
('QLD Mining Tenure', 'QLD', 'Queensland Mining and Exploration Tenure Series', 'https://www.data.qld.gov.au/', 'SHP/TAB/FGDB', 'weekly', 'GDA2020', 'Creative Commons'),
('VIC Mineral Tenements', 'VIC', 'Mineral Tenements from Department of Energy, Environment and Climate Action', 'https://discover.data.vic.gov.au/', 'SHP/WFS/WMS', 'monthly', 'GDA2020', 'Creative Commons'),
('GA National Dataset', 'ALL', 'National Mineral Tenements from Geoscience Australia', 'https://ecat.ga.gov.au/', 'Various', 'quarterly', 'GDA2020', 'Creative Commons')
ON CONFLICT (name) DO NOTHING;

-- Create function to get tenements within a bounding box (for map queries)
CREATE OR REPLACE FUNCTION get_tenements_in_bbox(
    bbox_west FLOAT,
    bbox_south FLOAT, 
    bbox_east FLOAT,
    bbox_north FLOAT,
    zoom_level INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    number TEXT,
    type TEXT,
    status TEXT,
    holder_name TEXT,
    jurisdiction TEXT,
    area_ha NUMERIC,
    expiry_date DATE,
    geometry_geojson TEXT,
    centroid_lng FLOAT,
    centroid_lat FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.number,
        t.type,
        t.status,
        t.holder_name,
        t.jurisdiction,
        t.area_ha,
        t.expiry_date,
        CASE 
            WHEN zoom_level > 12 THEN ST_AsGeoJSON(t.geometry)::TEXT
            ELSE ST_AsGeoJSON(t.geometry_simplified)::TEXT
        END as geometry_geojson,
        ST_X(t.centroid) as centroid_lng,
        ST_Y(t.centroid) as centroid_lat
    FROM tenements t
    WHERE t.geometry IS NOT NULL
    AND ST_Intersects(
        t.bbox,
        ST_MakeEnvelope(bbox_west, bbox_south, bbox_east, bbox_north, 4326)
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to simplify geometries for different zoom levels
CREATE OR REPLACE FUNCTION simplify_tenement_geometries()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- Update simplified geometries for better performance
    UPDATE tenements 
    SET geometry_simplified = ST_Simplify(geometry, 0.001) -- Simplify to ~100m tolerance
    WHERE geometry IS NOT NULL 
    AND geometry_simplified IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for common map queries
CREATE INDEX IF NOT EXISTS idx_tenements_jurisdiction_status ON tenements (jurisdiction, status);
CREATE INDEX IF NOT EXISTS idx_tenements_type_status ON tenements (type, status);
CREATE INDEX IF NOT EXISTS idx_tenements_holder_name_trgm ON tenements USING gin (holder_name gin_trgm_ops);

-- Enable trigram extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

COMMENT ON TABLE tenements IS 'Enhanced tenements table with real geometric data from government sources';
COMMENT ON COLUMN tenements.geometry IS 'Full resolution geometry in WGS84';
COMMENT ON COLUMN tenements.geometry_simplified IS 'Simplified geometry for performance';
COMMENT ON COLUMN tenements.centroid IS 'Center point for map markers';
COMMENT ON COLUMN tenements.bbox IS 'Bounding box for spatial queries';
COMMENT ON COLUMN tenements.geometry_quality IS 'Quality of geometry: surveyed, unsurveyed, approximate';
COMMENT ON COLUMN tenements.data_source_name IS 'Government data source name';
COMMENT ON TABLE tenement_data_sources IS 'Metadata about government data sources';
