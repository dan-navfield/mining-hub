-- Create shire_rates table for managing property rates documents and data
CREATE TABLE IF NOT EXISTS public.shire_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Document information
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- 'pdf', 'doc', 'docx', 'image'
    document_url TEXT, -- Supabase storage URL
    document_size_bytes INTEGER,
    
    -- OCR and processing
    ocr_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    ocr_confidence DECIMAL(5,2), -- OCR confidence score (0-100)
    raw_ocr_text TEXT, -- Full OCR extracted text
    
    -- Parsed shire rates data
    shire_name VARCHAR(255),
    property_address TEXT,
    property_description TEXT,
    assessment_number VARCHAR(100),
    property_owner VARCHAR(255),
    
    -- Financial information
    land_value DECIMAL(12,2),
    capital_improved_value DECIMAL(12,2),
    annual_value DECIMAL(12,2),
    
    -- Rates breakdown
    general_rates DECIMAL(10,2),
    water_rates DECIMAL(10,2),
    sewerage_rates DECIMAL(10,2),
    garbage_rates DECIMAL(10,2),
    other_charges DECIMAL(10,2),
    total_rates DECIMAL(10,2),
    
    -- Payment information
    due_date DATE,
    payment_date DATE,
    payment_status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'paid', 'overdue', 'partial'
    payment_method VARCHAR(100),
    
    -- Period information
    rating_period_start DATE,
    rating_period_end DATE,
    financial_year VARCHAR(20), -- e.g., '2024-2025'
    
    -- Client and property association
    client_name VARCHAR(255),
    client_id UUID, -- Future: link to clients table
    tenement_id UUID, -- Link to tenements if applicable
    property_reference VARCHAR(255), -- Internal property reference
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID, -- User who uploaded
    
    -- Additional fields for flexibility
    notes TEXT,
    tags TEXT[], -- Array of tags for categorization
    metadata JSONB -- Store any additional parsed data
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shire_rates_client_name ON public.shire_rates(client_name);
CREATE INDEX IF NOT EXISTS idx_shire_rates_due_date ON public.shire_rates(due_date);
CREATE INDEX IF NOT EXISTS idx_shire_rates_payment_status ON public.shire_rates(payment_status);
CREATE INDEX IF NOT EXISTS idx_shire_rates_financial_year ON public.shire_rates(financial_year);
CREATE INDEX IF NOT EXISTS idx_shire_rates_shire_name ON public.shire_rates(shire_name);
CREATE INDEX IF NOT EXISTS idx_shire_rates_created_at ON public.shire_rates(created_at);
CREATE INDEX IF NOT EXISTS idx_shire_rates_tenement_id ON public.shire_rates(tenement_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shire_rates_updated_at 
    BEFORE UPDATE ON public.shire_rates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE public.shire_rates ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can view their own shire rates" ON public.shire_rates
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own shire rates" ON public.shire_rates
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own shire rates" ON public.shire_rates
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own shire rates" ON public.shire_rates
    FOR DELETE USING (auth.uid() = created_by);

-- Create storage bucket for shire rates documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('shire-rates-documents', 'shire-rates-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload shire rates documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'shire-rates-documents' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can view their own shire rates documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'shire-rates-documents' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own shire rates documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'shire-rates-documents' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own shire rates documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'shire-rates-documents' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );
