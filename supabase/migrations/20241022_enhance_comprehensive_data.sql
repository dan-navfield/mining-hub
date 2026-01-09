-- Enhanced comprehensive data tables for projects, sites, and relationships

-- Add comprehensive data fields to tenements table
ALTER TABLE tenements ADD COLUMN IF NOT EXISTS data_completeness INTEGER DEFAULT 0;
ALTER TABLE tenements ADD COLUMN IF NOT EXISTS comprehensive_data_available BOOLEAN DEFAULT FALSE;
ALTER TABLE tenements ADD COLUMN IF NOT EXISTS sites_count INTEGER DEFAULT 0;
ALTER TABLE tenements ADD COLUMN IF NOT EXISTS projects_count INTEGER DEFAULT 0;
ALTER TABLE tenements ADD COLUMN IF NOT EXISTS last_comprehensive_sync TIMESTAMPTZ;

-- Enhanced sites table with comprehensive fields
CREATE TABLE IF NOT EXISTS sites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenement_id UUID REFERENCES tenements(id) ON DELETE CASCADE,
    site_code VARCHAR(50) UNIQUE NOT NULL,
    site_name TEXT NOT NULL,
    short_name TEXT,
    site_type VARCHAR(100),
    site_subtype VARCHAR(100),
    site_stage VARCHAR(100),
    commodities TEXT,
    target_commodities TEXT,
    primary_commodity TEXT,
    project_name TEXT,
    project_code VARCHAR(50),
    coordinates JSONB,
    confidence VARCHAR(50),
    point_confidence VARCHAR(50),
    web_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced projects table with comprehensive fields
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_code VARCHAR(50) UNIQUE NOT NULL,
    project_name TEXT NOT NULL,
    commodity TEXT,
    project_status VARCHAR(100) DEFAULT 'Active',
    associated_sites TEXT,
    commodities_list TEXT,
    project_description TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenement-Project relationship table
CREATE TABLE IF NOT EXISTS tenement_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenement_id UUID REFERENCES tenements(id) ON DELETE CASCADE,
    project_code VARCHAR(50) REFERENCES projects(project_code) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'associated',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenement_id, project_code)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sites_tenement_id ON sites(tenement_id);
CREATE INDEX IF NOT EXISTS idx_sites_project_code ON sites(project_code);
CREATE INDEX IF NOT EXISTS idx_sites_site_code ON sites(site_code);
CREATE INDEX IF NOT EXISTS idx_projects_project_code ON projects(project_code);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(project_status);
CREATE INDEX IF NOT EXISTS idx_tenement_projects_tenement_id ON tenement_projects(tenement_id);
CREATE INDEX IF NOT EXISTS idx_tenement_projects_project_code ON tenement_projects(project_code);
CREATE INDEX IF NOT EXISTS idx_tenements_comprehensive ON tenements(comprehensive_data_available);
CREATE INDEX IF NOT EXISTS idx_tenements_data_completeness ON tenements(data_completeness);

-- Add RLS policies
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenement_projects ENABLE ROW LEVEL SECURITY;

-- Allow read access to all users
CREATE POLICY "Allow read access to sites" ON sites FOR SELECT USING (true);
CREATE POLICY "Allow read access to projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow read access to tenement_projects" ON tenement_projects FOR SELECT USING (true);

-- Allow insert/update for service role
CREATE POLICY "Allow service role to manage sites" ON sites FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage projects" ON projects FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage tenement_projects" ON tenement_projects FOR ALL USING (auth.role() = 'service_role');

-- Update function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_sites_updated_at ON sites;
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE sites IS 'Mining sites with comprehensive data from government APIs';
COMMENT ON TABLE projects IS 'Mining projects with associated sites and tenements';
COMMENT ON TABLE tenement_projects IS 'Many-to-many relationship between tenements and projects';
COMMENT ON COLUMN tenements.data_completeness IS 'Percentage of comprehensive data available (0-100)';
COMMENT ON COLUMN tenements.comprehensive_data_available IS 'Whether comprehensive data has been synced';
COMMENT ON COLUMN sites.coordinates IS 'JSON object with latitude and longitude';
COMMENT ON COLUMN sites.web_link IS 'Link to detailed information in MINEDX or other systems';
