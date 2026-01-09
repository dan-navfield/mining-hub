-- Enhanced Tenement Data Migration
-- Adds comprehensive tables for sites, projects, environmental registrations, production, etc.

-- Sites table for mining sites associated with tenements
CREATE TABLE IF NOT EXISTS sites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenement_id UUID REFERENCES tenements(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    site_name TEXT NOT NULL,
    site_code TEXT,
    site_type TEXT,
    site_subtype TEXT,
    site_stage TEXT,
    primary_classification TEXT,
    coordinates JSONB, -- {latitude: number, longitude: number}
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table for mining projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_name TEXT NOT NULL,
    project_code TEXT UNIQUE,
    short_name TEXT,
    commodity TEXT,
    project_status TEXT,
    project_stage TEXT,
    mine_stage TEXT,
    small_mining_operation BOOLEAN DEFAULT FALSE,
    total_current_sites INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    commodities_and_groups TEXT[],
    alternative_names TEXT[],
    notes TEXT[],
    minedx_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project owners
CREATE TABLE IF NOT EXISTS project_owners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    owner_name TEXT NOT NULL,
    owner_type TEXT,
    percentage DECIMAL(5,2),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Environmental registrations
CREATE TABLE IF NOT EXISTS environmental_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenement_id UUID REFERENCES tenements(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    registration_id TEXT,
    registration_name TEXT,
    registration_category TEXT,
    registration_status TEXT,
    date_decided DATE,
    environmental_operator TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Production records
CREATE TABLE IF NOT EXISTS production_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenement_id UUID REFERENCES tenements(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    start_date DATE,
    end_date DATE,
    production_period TEXT,
    product TEXT,
    quantity DECIMAL(15,3),
    unit TEXT,
    grade TEXT,
    commodity TEXT,
    calculated_commodity TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Information sources
CREATE TABLE IF NOT EXISTS information_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenement_id UUID REFERENCES tenements(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL,
    title TEXT NOT NULL,
    identifier TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project attachments
CREATE TABLE IF NOT EXISTS project_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size TEXT,
    upload_date DATE,
    description TEXT,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project events
CREATE TABLE IF NOT EXISTS project_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    event_type TEXT NOT NULL,
    description TEXT,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenement-Project relationships (many-to-many)
CREATE TABLE IF NOT EXISTS tenement_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenement_id UUID REFERENCES tenements(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenement_id, project_id)
);

-- Add enhanced fields to existing tenements table
ALTER TABLE tenements 
ADD COLUMN IF NOT EXISTS enhanced_data_scraped BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS enhanced_data_scraped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sites_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS projects_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS environmental_registrations_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS production_records_count INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sites_tenement_id ON sites(tenement_id);
CREATE INDEX IF NOT EXISTS idx_sites_project_id ON sites(project_id);
CREATE INDEX IF NOT EXISTS idx_sites_site_code ON sites(site_code);
CREATE INDEX IF NOT EXISTS idx_projects_project_code ON projects(project_code);
CREATE INDEX IF NOT EXISTS idx_project_owners_project_id ON project_owners(project_id);
CREATE INDEX IF NOT EXISTS idx_environmental_registrations_tenement_id ON environmental_registrations(tenement_id);
CREATE INDEX IF NOT EXISTS idx_environmental_registrations_project_id ON environmental_registrations(project_id);
CREATE INDEX IF NOT EXISTS idx_production_records_tenement_id ON production_records(tenement_id);
CREATE INDEX IF NOT EXISTS idx_production_records_project_id ON production_records(project_id);
CREATE INDEX IF NOT EXISTS idx_information_sources_tenement_id ON information_sources(tenement_id);
CREATE INDEX IF NOT EXISTS idx_information_sources_project_id ON information_sources(project_id);
CREATE INDEX IF NOT EXISTS idx_project_attachments_project_id ON project_attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_events_project_id ON project_events(project_id);
CREATE INDEX IF NOT EXISTS idx_tenement_projects_tenement_id ON tenement_projects(tenement_id);
CREATE INDEX IF NOT EXISTS idx_tenement_projects_project_id ON tenement_projects(project_id);

-- Create updated_at triggers for tables that need them
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_environmental_registrations_updated_at BEFORE UPDATE ON environmental_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_records_updated_at BEFORE UPDATE ON production_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for easy data access
CREATE OR REPLACE VIEW tenements_with_enhanced_data AS
SELECT 
    t.*,
    COUNT(DISTINCT s.id) as sites_count,
    COUNT(DISTINCT tp.project_id) as projects_count,
    COUNT(DISTINCT er.id) as environmental_registrations_count,
    COUNT(DISTINCT pr.id) as production_records_count
FROM tenements t
LEFT JOIN sites s ON t.id = s.tenement_id
LEFT JOIN tenement_projects tp ON t.id = tp.tenement_id
LEFT JOIN environmental_registrations er ON t.id = er.tenement_id
LEFT JOIN production_records pr ON t.id = pr.tenement_id
GROUP BY t.id;

CREATE OR REPLACE VIEW projects_with_details AS
SELECT 
    p.*,
    COUNT(DISTINCT s.id) as sites_count,
    COUNT(DISTINCT tp.tenement_id) as tenements_count,
    COUNT(DISTINCT po.id) as owners_count,
    COUNT(DISTINCT er.id) as environmental_registrations_count,
    COUNT(DISTINCT pa.id) as attachments_count,
    COUNT(DISTINCT pe.id) as events_count
FROM projects p
LEFT JOIN sites s ON p.id = s.project_id
LEFT JOIN tenement_projects tp ON p.id = tp.project_id
LEFT JOIN project_owners po ON p.id = po.project_id
LEFT JOIN environmental_registrations er ON p.id = er.project_id
LEFT JOIN project_attachments pa ON p.id = pa.project_id
LEFT JOIN project_events pe ON p.id = pe.project_id
GROUP BY p.id;

-- Add comments for documentation
COMMENT ON TABLE sites IS 'Mining sites associated with tenements and projects';
COMMENT ON TABLE projects IS 'Mining projects with comprehensive details from MINEDX';
COMMENT ON TABLE project_owners IS 'Ownership information for mining projects';
COMMENT ON TABLE environmental_registrations IS 'Environmental compliance registrations';
COMMENT ON TABLE production_records IS 'Historical production data';
COMMENT ON TABLE information_sources IS 'Data sources and references';
COMMENT ON TABLE project_attachments IS 'Files and documents attached to projects';
COMMENT ON TABLE project_events IS 'Timeline events for projects';
COMMENT ON TABLE tenement_projects IS 'Many-to-many relationship between tenements and projects';
