-- Create client management system for tracking consultant-client relationships

-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Company information
    company_name VARCHAR(255) NOT NULL,
    abn VARCHAR(11), -- Australian Business Number
    acn VARCHAR(9),  -- Australian Company Number
    
    -- Contact information
    primary_contact_name VARCHAR(255),
    primary_contact_email VARCHAR(255),
    primary_contact_phone VARCHAR(50),
    
    -- Address information
    street_address TEXT,
    suburb VARCHAR(100),
    state VARCHAR(10),
    postcode VARCHAR(10),
    country VARCHAR(50) DEFAULT 'Australia',
    
    -- Business details
    industry_sector VARCHAR(100), -- 'Gold Mining', 'Iron Ore', 'Coal', 'Exploration', etc.
    company_size VARCHAR(50),     -- 'Small', 'Medium', 'Large', 'Major'
    
    -- Relationship status
    client_status VARCHAR(50) NOT NULL DEFAULT 'Active', -- 'Active', 'Inactive', 'Prospective', 'Former'
    relationship_start_date DATE,
    relationship_end_date DATE,
    
    -- Service details
    service_types TEXT[], -- Array of services: ['Compliance', 'Reporting', 'Due Diligence', etc.]
    billing_contact_email VARCHAR(255),
    billing_frequency VARCHAR(50), -- 'Monthly', 'Quarterly', 'Annual', 'Per Project'
    
    -- Internal notes
    notes TEXT,
    risk_level VARCHAR(20) DEFAULT 'Low', -- 'Low', 'Medium', 'High'
    
    -- Consultant assignment
    assigned_consultant_id UUID REFERENCES public.users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- Create client_tenements junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.client_tenements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    tenement_id UUID REFERENCES public.tenements(id) ON DELETE CASCADE NOT NULL,
    
    -- Relationship details
    relationship_type VARCHAR(50) NOT NULL DEFAULT 'Holder', -- 'Holder', 'Joint Venture', 'Operator', 'Consultant'
    ownership_percentage DECIMAL(5,2), -- For joint ventures
    start_date DATE,
    end_date DATE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    
    -- Ensure no duplicate relationships
    UNIQUE(client_id, tenement_id, relationship_type)
);

-- Create automatic tenement matching table
CREATE TABLE IF NOT EXISTS public.tenement_holder_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Matching criteria
    holder_name_pattern VARCHAR(255) NOT NULL, -- The holder name from tenements data
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    
    -- Matching rules
    match_type VARCHAR(50) NOT NULL DEFAULT 'Exact', -- 'Exact', 'Contains', 'StartsWith', 'EndsWith', 'Regex'
    is_case_sensitive BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    auto_create_relationships BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    
    -- Ensure unique patterns per client
    UNIQUE(holder_name_pattern, client_id)
);

-- Create indexes for performance
CREATE INDEX idx_clients_company_name ON public.clients(company_name);
CREATE INDEX idx_clients_status ON public.clients(client_status);
CREATE INDEX idx_clients_consultant ON public.clients(assigned_consultant_id);
CREATE INDEX idx_client_tenements_client ON public.client_tenements(client_id);
CREATE INDEX idx_client_tenements_tenement ON public.client_tenements(tenement_id);
CREATE INDEX idx_client_tenements_active ON public.client_tenements(is_active);
CREATE INDEX idx_holder_mappings_pattern ON public.tenement_holder_mappings(holder_name_pattern);
CREATE INDEX idx_holder_mappings_client ON public.tenement_holder_mappings(client_id);

-- Add updated_at triggers
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_tenements_updated_at BEFORE UPDATE ON public.client_tenements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_holder_mappings_updated_at BEFORE UPDATE ON public.tenement_holder_mappings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample client data
INSERT INTO public.clients (
    company_name, 
    abn, 
    primary_contact_name, 
    primary_contact_email, 
    primary_contact_phone,
    street_address,
    suburb,
    state,
    postcode,
    industry_sector,
    company_size,
    client_status,
    relationship_start_date,
    service_types,
    billing_frequency,
    notes
) VALUES 
(
    'Radiant Exploration Pty Ltd',
    '12345678901',
    'Sarah Mitchell',
    'sarah.mitchell@radiantexploration.com.au',
    '+61 8 9123 4567',
    'Level 3, 123 Mining Street',
    'West Perth',
    'WA',
    '6005',
    'Gold Exploration',
    'Small',
    'Active',
    '2024-01-15',
    ARRAY['Compliance', 'Reporting', 'Tenement Management'],
    'Monthly',
    'New exploration company focused on WA goldfields. High growth potential.'
),
(
    'Goldfields Mining Pty Ltd',
    '98765432109',
    'Michael Thompson',
    'mthompson@goldfields.com.au',
    '+61 8 9021 2345',
    '456 Hannan Street',
    'Kalgoorlie',
    'WA',
    '6430',
    'Gold Mining',
    'Medium',
    'Active',
    '2023-06-01',
    ARRAY['Compliance', 'Due Diligence', 'Environmental Reporting'],
    'Quarterly',
    'Established mining operation with multiple active sites.'
),
(
    'Northern Star Resources Ltd',
    '43092832892',
    'Emma Rodriguez',
    'emma.rodriguez@nsrltd.com',
    '+61 8 6188 2100',
    'Level 1, 388 Hay Street',
    'Subiaco',
    'WA',
    '6008',
    'Gold Mining',
    'Large',
    'Active',
    '2022-03-10',
    ARRAY['Strategic Consulting', 'Compliance', 'Regulatory Affairs'],
    'Annual',
    'Major gold producer. Premium client with comprehensive service requirements.'
);

-- Create automatic holder name mappings
INSERT INTO public.tenement_holder_mappings (
    holder_name_pattern,
    client_id,
    match_type,
    is_case_sensitive,
    auto_create_relationships
) VALUES 
(
    'RADIANT EXPLORATION PTY LTD',
    (SELECT id FROM public.clients WHERE company_name = 'Radiant Exploration Pty Ltd'),
    'Exact',
    FALSE,
    TRUE
),
(
    'GOLDFIELDS LIMITED',
    (SELECT id FROM public.clients WHERE company_name = 'Goldfields Mining Pty Ltd'),
    'Contains',
    FALSE,
    TRUE
),
(
    'NORTHERN STAR RESOURCES',
    (SELECT id FROM public.clients WHERE company_name = 'Northern Star Resources Ltd'),
    'Contains',
    FALSE,
    TRUE
);

-- Create RLS policies
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_tenements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenement_holder_mappings ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY "Enable read access for all users" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.clients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for all users" ON public.clients FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.clients FOR DELETE USING (true);

-- Client tenements policies  
CREATE POLICY "Enable read access for all users" ON public.client_tenements FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.client_tenements FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for all users" ON public.client_tenements FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.client_tenements FOR DELETE USING (true);

-- Holder mappings policies
CREATE POLICY "Enable read access for all users" ON public.tenement_holder_mappings FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.tenement_holder_mappings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for all users" ON public.tenement_holder_mappings FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.tenement_holder_mappings FOR DELETE USING (true);
