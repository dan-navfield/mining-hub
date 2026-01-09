-- Enhanced Tenement Data Migration - Complete Implementation
-- Adds comprehensive tables for sites, projects, environmental registrations, production, etc.

-- Projects table for mining projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_name TEXT NOT NULL,
    project_code TEXT UNIQUE,
    short_name TEXT,
    commodity TEXT,
    project_status TEXT,
    project_stage TEXT,
    project_exploration_stage TEXT,
    mine_stage TEXT,
    small_mining_operation BOOLEAN DEFAULT FALSE,
    total_current_sites INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    commodities_and_groups TEXT[],
    alternative_names TEXT[],
    notes TEXT[],
    minedx_url TEXT,
    scraped_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Commodity information
CREATE TABLE IF NOT EXISTS commodities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    category TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project commodities (many-to-many)
CREATE TABLE IF NOT EXISTS project_commodities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    commodity_id UUID REFERENCES commodities(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, commodity_id)
);

-- Tenement holders (normalized)
CREATE TABLE IF NOT EXISTS tenement_holders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenement_id UUID REFERENCES tenements(id) ON DELETE CASCADE,
    holder_name TEXT NOT NULL,
    interest TEXT,
    percentage DECIMAL(5,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add enhanced fields to existing tenements table (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenements' AND column_name = 'enhanced_data_scraped') THEN
        ALTER TABLE tenements ADD COLUMN enhanced_data_scraped BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenements' AND column_name = 'enhanced_data_scraped_at') THEN
        ALTER TABLE tenements ADD COLUMN enhanced_data_scraped_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenements' AND column_name = 'sites_count') THEN
        ALTER TABLE tenements ADD COLUMN sites_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenements' AND column_name = 'projects_count') THEN
        ALTER TABLE tenements ADD COLUMN projects_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenements' AND column_name = 'environmental_registrations_count') THEN
        ALTER TABLE tenements ADD COLUMN environmental_registrations_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenements' AND column_name = 'production_records_count') THEN
        ALTER TABLE tenements ADD COLUMN production_records_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenements' AND column_name = 'minedx_url') THEN
        ALTER TABLE tenements ADD COLUMN minedx_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenements' AND column_name = 'applied_date') THEN
        ALTER TABLE tenements ADD COLUMN applied_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenements' AND column_name = 'death_date') THEN
        ALTER TABLE tenements ADD COLUMN death_date DATE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sites_tenement_id ON sites(tenement_id);
CREATE INDEX IF NOT EXISTS idx_sites_project_id ON sites(project_id);
CREATE INDEX IF NOT EXISTS idx_sites_site_code ON sites(site_code);
CREATE INDEX IF NOT EXISTS idx_sites_site_type ON sites(site_type);
CREATE INDEX IF NOT EXISTS idx_projects_project_code ON projects(project_code);
CREATE INDEX IF NOT EXISTS idx_projects_commodity ON projects(commodity);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(project_status);
CREATE INDEX IF NOT EXISTS idx_project_owners_project_id ON project_owners(project_id);
CREATE INDEX IF NOT EXISTS idx_project_owners_name ON project_owners(owner_name);
CREATE INDEX IF NOT EXISTS idx_environmental_registrations_tenement_id ON environmental_registrations(tenement_id);
CREATE INDEX IF NOT EXISTS idx_environmental_registrations_project_id ON environmental_registrations(project_id);
CREATE INDEX IF NOT EXISTS idx_environmental_registrations_status ON environmental_registrations(registration_status);
CREATE INDEX IF NOT EXISTS idx_production_records_tenement_id ON production_records(tenement_id);
CREATE INDEX IF NOT EXISTS idx_production_records_project_id ON production_records(project_id);
CREATE INDEX IF NOT EXISTS idx_production_records_commodity ON production_records(commodity);
CREATE INDEX IF NOT EXISTS idx_information_sources_tenement_id ON information_sources(tenement_id);
CREATE INDEX IF NOT EXISTS idx_information_sources_project_id ON information_sources(project_id);
CREATE INDEX IF NOT EXISTS idx_information_sources_type ON information_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_project_attachments_project_id ON project_attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_events_project_id ON project_events(project_id);
CREATE INDEX IF NOT EXISTS idx_project_events_date ON project_events(event_date);
CREATE INDEX IF NOT EXISTS idx_tenement_projects_tenement_id ON tenement_projects(tenement_id);
CREATE INDEX IF NOT EXISTS idx_tenement_projects_project_id ON tenement_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_project_commodities_project_id ON project_commodities(project_id);
CREATE INDEX IF NOT EXISTS idx_project_commodities_commodity_id ON project_commodities(commodity_id);
CREATE INDEX IF NOT EXISTS idx_tenement_holders_tenement_id ON tenement_holders(tenement_id);
CREATE INDEX IF NOT EXISTS idx_tenement_holders_name ON tenement_holders(holder_name);

-- Create updated_at triggers for tables that need them
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_sites_updated_at ON sites;
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_environmental_registrations_updated_at ON environmental_registrations;
CREATE TRIGGER update_environmental_registrations_updated_at BEFORE UPDATE ON environmental_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_production_records_updated_at ON production_records;
CREATE TRIGGER update_production_records_updated_at BEFORE UPDATE ON production_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create comprehensive views for easy data access
CREATE OR REPLACE VIEW tenements_with_enhanced_data AS
SELECT 
    t.*,
    COUNT(DISTINCT s.id) as sites_count_calc,
    COUNT(DISTINCT tp.project_id) as projects_count_calc,
    COUNT(DISTINCT er.id) as environmental_registrations_count_calc,
    COUNT(DISTINCT pr.id) as production_records_count_calc,
    COUNT(DISTINCT th.id) as holders_count,
    STRING_AGG(DISTINCT p.commodity, ', ') as all_commodities,
    MAX(pe.event_date) as last_project_event_date
FROM tenements t
LEFT JOIN sites s ON t.id = s.tenement_id
LEFT JOIN tenement_projects tp ON t.id = tp.tenement_id
LEFT JOIN projects p ON tp.project_id = p.id
LEFT JOIN environmental_registrations er ON t.id = er.tenement_id
LEFT JOIN production_records pr ON t.id = pr.tenement_id
LEFT JOIN tenement_holders th ON t.id = th.tenement_id AND th.is_active = TRUE
LEFT JOIN project_events pe ON p.id = pe.project_id
GROUP BY t.id;

CREATE OR REPLACE VIEW projects_with_details AS
SELECT 
    p.*,
    COUNT(DISTINCT s.id) as sites_count_calc,
    COUNT(DISTINCT tp.tenement_id) as tenements_count,
    COUNT(DISTINCT po.id) as owners_count,
    COUNT(DISTINCT er.id) as environmental_registrations_count_calc,
    COUNT(DISTINCT pa.id) as attachments_count,
    COUNT(DISTINCT pe.id) as events_count,
    STRING_AGG(DISTINCT c.name, ', ') as all_commodities,
    MAX(pe.event_date) as last_event_date,
    MIN(pe.event_date) as first_event_date
FROM projects p
LEFT JOIN sites s ON p.id = s.project_id
LEFT JOIN tenement_projects tp ON p.id = tp.project_id
LEFT JOIN project_owners po ON p.id = po.project_id
LEFT JOIN environmental_registrations er ON p.id = er.project_id
LEFT JOIN project_attachments pa ON p.id = pa.project_id
LEFT JOIN project_events pe ON p.id = pe.project_id
LEFT JOIN project_commodities pc ON p.id = pc.project_id
LEFT JOIN commodities c ON pc.commodity_id = c.id
GROUP BY p.id;

CREATE OR REPLACE VIEW sites_with_context AS
SELECT 
    s.*,
    t.number as tenement_number,
    t.jurisdiction,
    t.status as tenement_status,
    p.project_name,
    p.commodity as project_commodity,
    p.project_status
FROM sites s
LEFT JOIN tenements t ON s.tenement_id = t.id
LEFT JOIN projects p ON s.project_id = p.id;

-- Insert common commodities
INSERT INTO commodities (name, code, category) VALUES
('Gold', 'AU', 'Precious Metals'),
('Iron Ore', 'FE', 'Base Metals'),
('Copper', 'CU', 'Base Metals'),
('Nickel', 'NI', 'Base Metals'),
('Lithium', 'LI', 'Battery Metals'),
('Uranium', 'U', 'Nuclear'),
('Coal', 'C', 'Energy'),
('Oil', 'OIL', 'Energy'),
('Gas', 'GAS', 'Energy'),
('Silver', 'AG', 'Precious Metals'),
('Platinum', 'PT', 'Precious Metals'),
('Palladium', 'PD', 'Precious Metals'),
('Zinc', 'ZN', 'Base Metals'),
('Lead', 'PB', 'Base Metals'),
('Tin', 'SN', 'Base Metals'),
('Cobalt', 'CO', 'Battery Metals'),
('Rare Earth Elements', 'REE', 'Critical Minerals'),
('Bauxite', 'AL2O3', 'Industrial Minerals'),
('Manganese', 'MN', 'Industrial Minerals'),
('Chromium', 'CR', 'Industrial Minerals')
ON CONFLICT (name) DO NOTHING;

-- Create functions for data analysis
CREATE OR REPLACE FUNCTION get_tenement_summary(tenement_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'tenement', row_to_json(t),
        'sites_count', COUNT(DISTINCT s.id),
        'projects_count', COUNT(DISTINCT p.id),
        'active_projects_count', COUNT(DISTINCT p.id) FILTER (WHERE p.project_status = 'Active'),
        'environmental_registrations_count', COUNT(DISTINCT er.id),
        'production_records_count', COUNT(DISTINCT pr.id),
        'total_production_value', SUM(pr.quantity * 
            CASE 
                WHEN pr.commodity = 'Gold' THEN 2000 -- Approximate gold price
                WHEN pr.commodity = 'Iron Ore' THEN 100
                ELSE 50
            END
        ),
        'commodities', array_agg(DISTINCT p.commodity) FILTER (WHERE p.commodity IS NOT NULL),
        'last_activity', MAX(GREATEST(
            COALESCE(pe.event_date, '1900-01-01'::date),
            COALESCE(pr.end_date, '1900-01-01'::date),
            COALESCE(t.last_sync_at::date, '1900-01-01'::date)
        ))
    ) INTO result
    FROM tenements t
    LEFT JOIN sites s ON t.id = s.tenement_id
    LEFT JOIN tenement_projects tp ON t.id = tp.tenement_id
    LEFT JOIN projects p ON tp.project_id = p.id
    LEFT JOIN environmental_registrations er ON t.id = er.tenement_id
    LEFT JOIN production_records pr ON t.id = pr.tenement_id
    LEFT JOIN project_events pe ON p.id = pe.project_id
    WHERE t.id = tenement_uuid
    GROUP BY t.id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to update tenement counts
CREATE OR REPLACE FUNCTION update_tenement_counts(tenement_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE tenements SET
        sites_count = (SELECT COUNT(*) FROM sites WHERE tenement_id = tenement_uuid),
        projects_count = (SELECT COUNT(DISTINCT project_id) FROM tenement_projects WHERE tenement_id = tenement_uuid),
        environmental_registrations_count = (SELECT COUNT(*) FROM environmental_registrations WHERE tenement_id = tenement_uuid),
        production_records_count = (SELECT COUNT(*) FROM production_records WHERE tenement_id = tenement_uuid),
        enhanced_data_scraped_at = NOW()
    WHERE id = tenement_uuid;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE sites IS 'Mining sites associated with tenements and projects from MINEDX';
COMMENT ON TABLE projects IS 'Mining projects with comprehensive details from MINEDX';
COMMENT ON TABLE project_owners IS 'Ownership information for mining projects';
COMMENT ON TABLE environmental_registrations IS 'Environmental compliance registrations';
COMMENT ON TABLE production_records IS 'Historical production data from mining operations';
COMMENT ON TABLE information_sources IS 'Data sources and references for tenements and projects';
COMMENT ON TABLE project_attachments IS 'Files and documents attached to projects';
COMMENT ON TABLE project_events IS 'Timeline events for projects';
COMMENT ON TABLE tenement_projects IS 'Many-to-many relationship between tenements and projects';
COMMENT ON TABLE commodities IS 'Master list of mining commodities';
COMMENT ON TABLE project_commodities IS 'Commodities associated with each project';
COMMENT ON TABLE tenement_holders IS 'Normalized holder information for tenements';

COMMENT ON VIEW tenements_with_enhanced_data IS 'Comprehensive view of tenements with all related data counts';
COMMENT ON VIEW projects_with_details IS 'Detailed view of projects with all related information';
COMMENT ON VIEW sites_with_context IS 'Sites with their tenement and project context';

COMMENT ON FUNCTION get_tenement_summary(UUID) IS 'Returns comprehensive summary of a tenement including all related data';
COMMENT ON FUNCTION update_tenement_counts(UUID) IS 'Updates the cached counts for a tenement after data changes';
