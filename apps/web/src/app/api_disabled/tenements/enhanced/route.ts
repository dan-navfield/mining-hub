import { NextRequest, NextResponse } from 'next/server';
import { waComprehensiveAPI } from '@/lib/services/wa-comprehensive-api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenementNumber = searchParams.get('tenement');
  const projectCode = searchParams.get('project');

  try {
    if (tenementNumber) {
      console.log(`🏛️ Fetching COMPREHENSIVE data from WA Government APIs for: ${tenementNumber}`);
      
      // Use the comprehensive API to get ALL available data
      const comprehensiveData = await waComprehensiveAPI.getComprehensiveTenementData(tenementNumber);
      
      if (comprehensiveData) {
        console.log(`✅ Successfully fetched COMPREHENSIVE data for ${tenementNumber}`);
        console.log(`📊 Found: ${comprehensiveData.holders?.length || 0} holders, ${comprehensiveData.sites?.length || 0} sites, ${comprehensiveData.projects?.length || 0} projects`);
        console.log(`📈 Data completeness: ${comprehensiveData.dataCompleteness}%`);
        
        return NextResponse.json({
          ...comprehensiveData,
          stored: true,
          lastScraped: new Date().toISOString()
        });
      } else {
        console.log(`⚠️ No comprehensive data found for ${tenementNumber}`);
        return NextResponse.json({
          tenementNumber,
          message: 'No comprehensive data available from WA Government APIs for this tenement',
          sites: [],
          projects: [],
          environmentalRegistrations: [],
          production: [],
          informationSources: [
            {
              type: 'WA Government APIs',
              title: 'Department of Energy, Mines, Industry Regulation and Safety (DMIRS)',
              identifier: tenementNumber
            }
          ],
          stored: false,
          lastScraped: new Date().toISOString(),
          dataCompleteness: 0
        });
      }

    } else if (projectCode) {
      console.log(`🔍 Loading enhanced data for project: ${projectCode}`);
      
      // Return mock project data
      const projectData = {
        projectCode,
        projectName: 'Stillson',
        commodity: 'Base earth elements; Uranium',
        status: 'Active',
        owners: [
          {
            ownerName: 'RADIANT EXPLORATION PTY LTD',
            percentage: 100
          }
        ]
      };
      
      return NextResponse.json(projectData);

    } else {
      return NextResponse.json(
        { error: 'Missing tenement or project parameter' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Enhanced scraping error:', error);
    return NextResponse.json(
      { error: 'Enhanced scraping service is temporarily unavailable' },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenementNumbers } = body;

    if (!Array.isArray(tenementNumbers) || tenementNumbers.length === 0) {
      return NextResponse.json(
        { error: 'Invalid tenementNumbers array' },
        { status: 400 }
      );
    }

    console.log(`Batch enhanced scraping temporarily disabled for ${tenementNumbers.length} tenements`);
    
    return NextResponse.json({
      success: false,
      message: 'Enhanced batch scraping is temporarily disabled due to compatibility issues.',
      status: 'disabled',
      count: 0,
      tenements: []
    });

  } catch (error) {
    console.error('Batch enhanced scraping error:', error);
    return NextResponse.json(
      { error: 'Enhanced scraping service is temporarily unavailable' },
      { status: 503 }
    );
  }
}
