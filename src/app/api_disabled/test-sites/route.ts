import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '1=1';
    const limit = searchParams.get('limit') || '10';
    
    console.log(`🔍 Testing sites API with query: ${query}`);
    
    const sitesUrl = 'https://services.slip.wa.gov.au/public/rest/services/SLIP_Public_Services/Industry_and_Mining/MapServer/0';
    const queryParams = new URLSearchParams({
      where: query,
      outFields: '*',
      f: 'json',
      returnGeometry: 'false',
      resultRecordCount: limit
    });
    
    const response = await fetch(`${sitesUrl}/query?${queryParams}`);
    const result = await response.json();
    
    if (result.features && result.features.length > 0) {
      console.log(`✅ Found ${result.features.length} sites`);
      
      // Return formatted results
      const sites = result.features.map((f: any) => ({
        site_code: f.attributes.site_code,
        site_title: f.attributes.site_title,
        short_name: f.attributes.short_name,
        site_type: f.attributes.site_type_,
        site_subtype: f.attributes.site_sub_t,
        site_stage: f.attributes.site_stage,
        commodities: f.attributes.site_commo,
        project_code: f.attributes.proj_code,
        project_title: f.attributes.proj_title,
        latitude: f.attributes.latitude,
        longitude: f.attributes.longitude,
        confidence: f.attributes.confidenti
      }));
      
      return NextResponse.json({
        success: true,
        count: sites.length,
        query,
        sites
      });
    } else {
      return NextResponse.json({
        success: false,
        count: 0,
        query,
        message: 'No sites found',
        sites: []
      });
    }

  } catch (error) {
    console.error('❌ Test sites API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        query: 'failed'
      },
      { status: 500 }
    );
  }
}
