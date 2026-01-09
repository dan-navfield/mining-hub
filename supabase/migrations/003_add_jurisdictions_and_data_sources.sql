-- Drop and recreate the jurisdiction enum with all values
DROP TYPE jurisdiction CASCADE;
CREATE TYPE jurisdiction AS ENUM ('WA', 'NSW', 'VIC', 'NT', 'QLD', 'TAS');

-- Add jurisdiction column back to tenements table
ALTER TABLE public.tenements ADD COLUMN jurisdiction jurisdiction NOT NULL DEFAULT 'WA';

-- Create data source related enums (with IF NOT EXISTS)
DO $$ BEGIN
    CREATE TYPE data_source_status AS ENUM ('Active', 'Inactive', 'Error', 'Maintenance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE data_source_type AS ENUM ('API', 'WebScraping', 'Manual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create data_sources table
CREATE TABLE public.data_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    jurisdiction jurisdiction NOT NULL,
    type data_source_type NOT NULL,
    status data_source_status DEFAULT 'Inactive',
    url TEXT NOT NULL,
    description TEXT,
    last_sync_at TIMESTAMPTZ,
    last_error TEXT,
    sync_interval INTEGER, -- in minutes
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for data_sources
CREATE INDEX idx_data_sources_jurisdiction ON public.data_sources(jurisdiction);
CREATE INDEX idx_data_sources_status ON public.data_sources(status);
CREATE INDEX idx_data_sources_enabled ON public.data_sources(is_enabled);

-- Add updated_at trigger for data_sources
CREATE TRIGGER update_data_sources_updated_at BEFORE UPDATE ON public.data_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data sources for each jurisdiction
INSERT INTO public.data_sources (name, jurisdiction, type, url, description, sync_interval, is_enabled) VALUES
('WA Mining Tenements DMIRS-003', 'WA', 'API', 'https://catalogue.data.wa.gov.au/dataset/mining-tenements-dmirs-003', 'Western Australia mining tenements from Department of Mines, Industry Regulation and Safety', 1440, true),
('NSW Mining Titles Register', 'NSW', 'WebScraping', 'https://www.resources.nsw.gov.au/mining-and-exploration/public-registers/mining-titles-register', 'New South Wales mining titles register - requires web scraping', 1440, true),
('GeoVic Victoria', 'VIC', 'WebScraping', 'https://resources.vic.gov.au/geology-exploration/maps-reports-data/geovic', 'Victoria GeoVic system - map-based interface requiring search/identify', 1440, true),
('NT Strike', 'NT', 'WebScraping', 'http://strike.nt.gov.au/', 'Northern Territory Strike system - similar interface to Victoria', 1440, true),
('QLD MyMinesOnline', 'QLD', 'API', 'https://www.business.qld.gov.au/industries/mining-energy-water/resources/minerals-coal/online-services/myminesonline', 'Queensland MyMinesOnline system - may have API access', 1440, true),
('TAS Mineral Resources Tasmania', 'TAS', 'WebScraping', 'https://www.mrt.tas.gov.au/products/online_services/web_services', 'Tasmania Mineral Resources web services and data portal', 1440, true);
