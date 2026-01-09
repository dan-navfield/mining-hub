-- Create holder contact information table
CREATE TABLE IF NOT EXISTS public.holder_contact_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Holder identification
    holder_name VARCHAR(255) NOT NULL UNIQUE,
    
    -- Company details from public sources
    abn VARCHAR(20),
    acn VARCHAR(20),
    entity_type VARCHAR(100),
    entity_status VARCHAR(50),
    
    -- Contact information
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website VARCHAR(255),
    
    -- Additional information
    notes TEXT,
    
    -- Data source tracking
    data_source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'abn_lookup', 'asic', etc.
    public_data_available BOOLEAN DEFAULT FALSE,
    last_public_lookup TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.users(id)
);

-- Create indexes for performance
CREATE INDEX idx_holder_contact_info_holder_name ON public.holder_contact_info(holder_name);
CREATE INDEX idx_holder_contact_info_abn ON public.holder_contact_info(abn);
CREATE INDEX idx_holder_contact_info_updated_at ON public.holder_contact_info(updated_at);

-- Add updated_at trigger
CREATE TRIGGER update_holder_contact_info_updated_at 
    BEFORE UPDATE ON public.holder_contact_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.holder_contact_info ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all holder contact info" ON public.holder_contact_info
    FOR SELECT USING (true);

CREATE POLICY "Users can insert holder contact info" ON public.holder_contact_info
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update holder contact info" ON public.holder_contact_info
    FOR UPDATE USING (true);

-- Insert some sample data for known companies
INSERT INTO public.holder_contact_info (
    holder_name,
    abn,
    address,
    contact_email,
    contact_phone,
    data_source,
    public_data_available
) VALUES 
(
    'RADIANT MINERALS PTY LTD',
    '12 345 678 901',
    'Perth WA 6000',
    'info@radiantminerals.com.au',
    '+61 8 9123 4567',
    'abn_lookup',
    true
),
(
    'RADIANT EXPLORATION PTY LTD',
    '98 765 432 109',
    'West Perth WA 6005',
    'contact@radiantexploration.com.au',
    '+61 8 9021 2345',
    'abn_lookup',
    true
),
(
    'CENTRAL PILBARA NORTH IRON ORE PTY LTD',
    '11 222 333 444',
    'Perth WA 6000',
    'info@cpnio.com.au',
    '+61 8 9000 1234',
    'abn_lookup',
    true
) ON CONFLICT (holder_name) DO NOTHING;
