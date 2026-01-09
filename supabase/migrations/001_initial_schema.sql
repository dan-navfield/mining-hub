-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE jurisdiction AS ENUM ('WA', 'NSW', 'VIC', 'NT', 'QLD', 'TAS');
CREATE TYPE action_type AS ENUM ('Anniversary', 'RentDue', 'Section29', 'AdHoc');
CREATE TYPE action_status AS ENUM ('Open', 'Snoozed', 'Done', 'Cancelled');
CREATE TYPE action_source AS ENUM ('System', 'Manual');
CREATE TYPE due_diligence_status AS ENUM ('Queued', 'Running', 'Succeeded', 'Failed');
CREATE TYPE user_role AS ENUM ('Administrator', 'Consultant');

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'Consultant',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tenements table
CREATE TABLE public.tenements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    jurisdiction jurisdiction NOT NULL,
    number TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    holder_name TEXT,
    markout_date DATE,
    application_date DATE,
    grant_date DATE,
    expiry_date DATE,
    anniversary_date DATE,
    area_ha DECIMAL(10,2),
    section29_flag BOOLEAN DEFAULT FALSE,
    last_sync_at TIMESTAMPTZ DEFAULT NOW(),
    source_wfs_ref TEXT,
    source_mto_ref TEXT,
    consultant_user_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(jurisdiction, number)
);

-- Create actions table
CREATE TABLE public.actions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenement_id UUID REFERENCES public.tenements(id) ON DELETE CASCADE NOT NULL,
    type action_type NOT NULL,
    title TEXT NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(10,2),
    status action_status DEFAULT 'Open',
    assigned_to_user_id UUID REFERENCES public.users(id),
    notes TEXT,
    source action_source DEFAULT 'Manual',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create due_diligence_runs table
CREATE TABLE public.due_diligence_runs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_by_user_id UUID REFERENCES public.users(id) NOT NULL,
    tenement_ids JSONB NOT NULL,
    template_key TEXT NOT NULL,
    output_uri TEXT,
    status due_diligence_status DEFAULT 'Queued',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_events table
CREATE TABLE public.audit_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    entity TEXT NOT NULL,
    entity_id UUID NOT NULL,
    actor_user_id UUID REFERENCES public.users(id) NOT NULL,
    change_json JSONB NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_tenements_number ON public.tenements(number);
CREATE INDEX idx_tenements_status ON public.tenements(status);
CREATE INDEX idx_tenements_expiry_date ON public.tenements(expiry_date);
CREATE INDEX idx_tenements_anniversary_date ON public.tenements(anniversary_date);
CREATE INDEX idx_tenements_consultant ON public.tenements(consultant_user_id);

CREATE INDEX idx_actions_tenement_id ON public.actions(tenement_id);
CREATE INDEX idx_actions_status ON public.actions(status);
CREATE INDEX idx_actions_due_date ON public.actions(due_date);
CREATE INDEX idx_actions_assigned_to ON public.actions(assigned_to_user_id);
CREATE INDEX idx_actions_type ON public.actions(type);

CREATE INDEX idx_due_diligence_created_by ON public.due_diligence_runs(created_by_user_id);
CREATE INDEX idx_due_diligence_status ON public.due_diligence_runs(status);

CREATE INDEX idx_audit_entity ON public.audit_events(entity, entity_id);
CREATE INDEX idx_audit_actor ON public.audit_events(actor_user_id);
CREATE INDEX idx_audit_created_at ON public.audit_events(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_tenements_updated_at BEFORE UPDATE ON public.tenements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_actions_updated_at BEFORE UPDATE ON public.actions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
