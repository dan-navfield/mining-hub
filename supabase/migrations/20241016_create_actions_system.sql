-- Create enum types for actions system (with IF NOT EXISTS)
DO $$ BEGIN
    CREATE TYPE action_type AS ENUM (
      'renewal',
      'payment',
      'expenditure',
      'reporting',
      'compliance',
      'shire_rates',
      'objection',
      'custom'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Extend existing action_status enum with new values (only if enum exists)
DO $$ BEGIN
    -- Check if action_status type exists first
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_status') THEN
        -- Add new enum values if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending' AND enumtypid = 'action_status'::regtype) THEN
            ALTER TYPE action_status ADD VALUE 'pending';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'completed' AND enumtypid = 'action_status'::regtype) THEN
            ALTER TYPE action_status ADD VALUE 'completed';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'overdue' AND enumtypid = 'action_status'::regtype) THEN
            ALTER TYPE action_status ADD VALUE 'overdue';
        END IF;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE recurrence_interval AS ENUM (
      'none',
      'daily',
      'weekly',
      'monthly',
      'quarterly',
      'annually'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE objection_type AS ENUM (
      'wardens_court',
      'native_title',
      'environmental',
      'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Actions table - Core compliance and operational obligations
CREATE TABLE IF NOT EXISTS actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenement_id UUID REFERENCES tenements(id) ON DELETE CASCADE,
  tenement_number VARCHAR(50) NOT NULL,
  jurisdiction jurisdiction NOT NULL,
  
  -- Action details
  action_name VARCHAR(255) NOT NULL,
  action_type action_type NOT NULL DEFAULT 'custom',
  status action_status NOT NULL DEFAULT 'Open',
  
  -- Dates and timing
  due_date DATE NOT NULL,
  completed_date DATE,
  created_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Financial
  amount DECIMAL(12,2),
  currency VARCHAR(3) DEFAULT 'AUD',
  
  -- Content
  description TEXT,
  comments TEXT,
  
  -- Recurrence
  recurrence_interval recurrence_interval DEFAULT 'none',
  recurrence_end_date DATE,
  parent_action_id UUID REFERENCES actions(id),
  
  -- Data source tracking
  data_source VARCHAR(100), -- e.g., 'MTO_WA', 'manual', 'csv_import'
  external_reference VARCHAR(255), -- Reference ID from external system
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID, -- Future: link to users table
  
  -- Indexes
  CONSTRAINT valid_amount CHECK (amount IS NULL OR amount >= 0),
  CONSTRAINT valid_dates CHECK (due_date >= created_date),
  CONSTRAINT valid_recurrence_end CHECK (recurrence_end_date IS NULL OR recurrence_end_date >= due_date)
);

-- Shire rates table - Local government rate obligations
CREATE TABLE IF NOT EXISTS shire_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Shire/Council details
  shire_name VARCHAR(255) NOT NULL,
  shire_code VARCHAR(50),
  state_territory jurisdiction NOT NULL,
  
  -- Rate details
  rate_year INTEGER NOT NULL,
  rate_amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  
  -- Property details
  property_description TEXT,
  lot_plan VARCHAR(100),
  
  -- Status
  paid_date DATE,
  paid_amount DECIMAL(10,2),
  status action_status NOT NULL DEFAULT 'Open',
  
  -- Notes
  comments TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_rate_amount CHECK (rate_amount > 0),
  CONSTRAINT valid_paid_amount CHECK (paid_amount IS NULL OR paid_amount >= 0)
);

-- Junction table for shire rates to tenements (many-to-many)
CREATE TABLE IF NOT EXISTS shire_rates_tenements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shire_rate_id UUID NOT NULL REFERENCES shire_rates(id) ON DELETE CASCADE,
  tenement_id UUID NOT NULL REFERENCES tenements(id) ON DELETE CASCADE,
  tenement_number VARCHAR(50) NOT NULL,
  
  -- Allocation details
  allocation_percentage DECIMAL(5,2) DEFAULT 100.00,
  allocated_amount DECIMAL(10,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(shire_rate_id, tenement_id),
  CONSTRAINT valid_allocation CHECK (allocation_percentage > 0 AND allocation_percentage <= 100)
);

-- Objections table - Legal disputes and objections
CREATE TABLE IF NOT EXISTS objections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Objection details
  objection_number VARCHAR(100),
  objection_type objection_type NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  
  -- Parties
  applicant VARCHAR(255),
  respondent VARCHAR(255),
  
  -- Court/Tribunal details
  court_tribunal VARCHAR(255),
  matter_number VARCHAR(100),
  
  -- Key dates
  lodged_date DATE,
  hearing_date DATE,
  conference_date DATE,
  decision_date DATE,
  
  -- Status
  status action_status NOT NULL DEFAULT 'Open',
  outcome TEXT,
  
  -- Documents and references
  documents JSONB, -- Array of document references
  external_links JSONB, -- Array of external links
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_objection_dates CHECK (
    (hearing_date IS NULL OR lodged_date IS NULL OR hearing_date >= lodged_date) AND
    (conference_date IS NULL OR lodged_date IS NULL OR conference_date >= lodged_date) AND
    (decision_date IS NULL OR lodged_date IS NULL OR decision_date >= lodged_date)
  )
);

-- Junction table for objections to tenements (many-to-many)
CREATE TABLE IF NOT EXISTS objections_tenements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objection_id UUID NOT NULL REFERENCES objections(id) ON DELETE CASCADE,
  tenement_id UUID REFERENCES tenements(id) ON DELETE CASCADE,
  tenement_number VARCHAR(50) NOT NULL,
  
  -- Relationship details
  relationship_type VARCHAR(100), -- e.g., 'subject', 'affected', 'related'
  comments TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(objection_id, tenement_id)
);

-- Due diligence reports table - Generated reports
CREATE TABLE IF NOT EXISTS due_diligence_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Report details
  report_name VARCHAR(255) NOT NULL,
  report_type VARCHAR(100) NOT NULL, -- e.g., 'full', 'summary', 'expenditure'
  
  -- Scope
  tenement_ids UUID[] NOT NULL,
  jurisdiction_filter jurisdiction[],
  date_range_start DATE,
  date_range_end DATE,
  
  -- Report data
  report_data JSONB NOT NULL, -- Structured report content
  summary_stats JSONB, -- Key statistics
  
  -- Generation details
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_by UUID, -- Future: link to users table
  
  -- Export details
  exported_formats VARCHAR(50)[], -- e.g., ['pdf', 'excel', 'json']
  export_paths JSONB, -- File paths or URLs
  
  -- Status
  status VARCHAR(50) DEFAULT 'completed',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_actions_tenement_id ON actions(tenement_id);
CREATE INDEX IF NOT EXISTS idx_actions_due_date ON actions(due_date);
CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status);
CREATE INDEX IF NOT EXISTS idx_actions_jurisdiction ON actions(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_actions_type ON actions(action_type);
CREATE INDEX IF NOT EXISTS idx_actions_tenement_number ON actions(tenement_number);

CREATE INDEX IF NOT EXISTS idx_shire_rates_due_date ON shire_rates(due_date);
CREATE INDEX IF NOT EXISTS idx_shire_rates_status ON shire_rates(status);
CREATE INDEX IF NOT EXISTS idx_shire_rates_shire_name ON shire_rates(shire_name);

CREATE INDEX IF NOT EXISTS idx_objections_status ON objections(status);
CREATE INDEX IF NOT EXISTS idx_objections_type ON objections(objection_type);
CREATE INDEX IF NOT EXISTS idx_objections_hearing_date ON objections(hearing_date);

CREATE INDEX IF NOT EXISTS idx_due_diligence_generated_at ON due_diligence_reports(generated_at);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_actions_updated_at BEFORE UPDATE ON actions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shire_rates_updated_at BEFORE UPDATE ON shire_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_objections_updated_at BEFORE UPDATE ON objections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies (Row Level Security)
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shire_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shire_rates_tenements ENABLE ROW LEVEL SECURITY;
ALTER TABLE objections ENABLE ROW LEVEL SECURITY;
ALTER TABLE objections_tenements ENABLE ROW LEVEL SECURITY;
ALTER TABLE due_diligence_reports ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be refined based on user roles)
CREATE POLICY "Enable read access for all users" ON actions FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON actions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON actions FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON actions FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON shire_rates FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON shire_rates FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON shire_rates FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON shire_rates FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON shire_rates_tenements FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON shire_rates_tenements FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON shire_rates_tenements FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON shire_rates_tenements FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON objections FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON objections FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON objections FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON objections FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON objections_tenements FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON objections_tenements FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON objections_tenements FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON objections_tenements FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON due_diligence_reports FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON due_diligence_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON due_diligence_reports FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON due_diligence_reports FOR DELETE USING (true);

-- Insert some sample data for testing
INSERT INTO actions (tenement_number, jurisdiction, action_name, action_type, due_date, amount, description, data_source) VALUES
('M123456', 'WA', 'Annual Rent Payment', 'payment', '2024-12-31', 2500.00, 'Annual rent payment for mining lease', 'MTO_WA'),
('E789012', 'WA', 'Expenditure Report', 'reporting', '2024-11-15', NULL, 'Submit annual expenditure report', 'MTO_WA'),
('ML345678', 'NSW', 'Environmental Bond Renewal', 'renewal', '2024-12-01', 50000.00, 'Renew environmental security bond', 'manual'),
('EL901234', 'VIC', 'Compliance Inspection', 'compliance', '2024-10-30', NULL, 'Scheduled compliance inspection', 'manual');

INSERT INTO shire_rates (shire_name, shire_code, state_territory, rate_year, rate_amount, due_date, property_description) VALUES
('Shire of Coolgardie', 'COOL', 'WA', 2024, 1250.75, '2024-11-30', 'Mining tenement M123456 area'),
('Kalgoorlie-Boulder City', 'KALB', 'WA', 2024, 3200.00, '2024-12-15', 'Exploration lease E789012'),
('Broken Hill City Council', 'BHCC', 'NSW', 2024, 890.50, '2024-10-31', 'Mining lease ML345678 portion');

INSERT INTO objections (objection_number, objection_type, title, applicant, respondent, court_tribunal, lodged_date, hearing_date) VALUES
('WC2024/001', 'wardens_court', 'Objection to Mining Lease Application ML123456', 'Local Landowners Group', 'ABC Mining Pty Ltd', 'Wardens Court of Western Australia', '2024-09-15', '2024-11-20'),
('NT2024/045', 'native_title', 'Native Title Claim over Exploration Area', 'Traditional Owners Corporation', 'XYZ Exploration Ltd', 'Federal Court of Australia', '2024-08-01', '2024-12-10');
