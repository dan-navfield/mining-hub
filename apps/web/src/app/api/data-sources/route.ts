import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock data sources for now - in a real app, these would come from a database
    const dataSources = [
      {
        id: 'wa-comprehensive',
        name: 'WA Comprehensive API',
        jurisdiction: 'WA',
        type: 'Government API',
        status: 'Active',
        url: 'https://services.slip.wa.gov.au/public/rest/services/SLIP_Public_Services/Industry_and_Mining/MapServer/',
        description: 'WA Government SLIP APIs - Comprehensive tenement, sites, and projects data from DMIRS',
        last_sync_at: new Date().toISOString(),
        sync_interval: 24,
        is_enabled: true,
      },
      {
        id: 'nsw-titles',
        name: 'NSW Titles',
        jurisdiction: 'NSW',
        type: 'API',
        status: 'Active',
        url: 'https://www.business.qld.gov.au/industries/mining-energy-water/resources/minerals-coal/online-services/myminesonline',
        description: 'New South Wales mining titles system',
        last_sync_at: new Date().toISOString(),
        sync_interval: 24,
        is_enabled: true,
      },
      {
        id: 'vic-earthres',
        name: 'VIC EarthRes',
        jurisdiction: 'VIC',
        type: 'WebScraping',
        status: 'Active',
        url: 'https://earthresources.vic.gov.au/',
        description: 'Victoria Earth Resources portal',
        last_sync_at: new Date().toISOString(),
        sync_interval: 24,
        is_enabled: true,
      },
      {
        id: 'nt-strike',
        name: 'NT Strike',
        jurisdiction: 'NT',
        type: 'WebScraping',
        status: 'Active',
        url: 'http://strike.nt.gov.au',
        description: 'Northern Territory Strike system - similar interface to Victoria',
        last_sync_at: new Date().toISOString(),
        sync_interval: 24,
        is_enabled: true,
      },
      {
        id: 'qld-myminesonline',
        name: 'QLD MyMinesOnline',
        jurisdiction: 'QLD',
        type: 'API',
        status: 'Active',
        url: 'https://www.business.qld.gov.au/industries/mining-energy-water/resources/minerals-coal/online-services/myminesonline',
        description: 'Queensland MyMinesOnline system - may have API access',
        last_sync_at: new Date().toISOString(),
        sync_interval: 24,
        is_enabled: true,
      },
      {
        id: 'tas-mrt',
        name: 'TAS Mineral Resources Tasmania',
        jurisdiction: 'TAS',
        type: 'WebScraping',
        status: 'Active',
        url: 'https://www.mrt.tas.gov.au/products/online_services/web_services',
        description: 'Tasmania Mineral Resources web services and data portal',
        last_sync_at: new Date().toISOString(),
        sync_interval: 24,
        is_enabled: true,
      },
    ];

    return NextResponse.json(dataSources);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
