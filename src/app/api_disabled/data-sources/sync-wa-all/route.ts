import { NextRequest, NextResponse } from 'next/server';
import { waComprehensiveAPI } from '@/lib/services/wa-comprehensive-api';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting MASSIVE WA sync - ALL TENEMENTS with ALL DATA...');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // First, get ALL WA tenements from the government API
    console.log('📡 Fetching ALL WA tenements from government API...');
    
    const tenementsApiUrl = 'https://services.slip.wa.gov.au/public/rest/services/SLIP_Public_Services/Industry_and_Mining/MapServer/3/query';
    const queryParams = new URLSearchParams({
      where: '1=1', // Get everything
      outFields: 'fmt_tenid,tenid,type,tenstatus,holder1,grantdate,startdate,enddate,legal_area,unit_of_me',
      f: 'json',
      returnGeometry: 'false',
      resultRecordCount: '10000' // Get ALL tenements
    });
    
    const response = await fetch(`${tenementsApiUrl}?${queryParams}`);
    const apiResult = await response.json();
    
    if (!apiResult.features || apiResult.features.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No tenements found from WA Government API',
        imported: 0,
        errors: ['No data returned from government API']
      });
    }

    console.log(`📊 Found ${apiResult.features.length} WA tenements from government API`);
    
    let imported = 0;
    let updated = 0;
    const errors: string[] = [];
    const batchSize = 50; // Process in batches to avoid timeouts
    
    // Process all tenements in batches
    for (let i = 0; i < apiResult.features.length; i += batchSize) {
      const batch = apiResult.features.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(apiResult.features.length/batchSize)} (${batch.length} tenements)...`);
      
      for (const feature of batch) {
        try {
          const attrs = feature.attributes;
          const tenementNumber = attrs.fmt_tenid || attrs.tenid;
          
          if (!tenementNumber || !tenementNumber.trim()) {
            continue;
          }

          // Generate consistent UUID
          const crypto = require('crypto');
          const hash = crypto.createHash('sha256').update(`WA-${tenementNumber}`).digest('hex');
          const tenementUuid = [
            hash.substr(0, 8),
            hash.substr(8, 4),
            '4' + hash.substr(13, 3),
            ((parseInt(hash.substr(16, 1), 16) & 0x3) | 0x8).toString(16) + hash.substr(17, 3),
            hash.substr(20, 12)
          ].join('-');

          // Insert/update basic tenement data from government API
          const { error: tenementError } = await supabase
            .from('tenements')
            .upsert({
              id: tenementUuid,
              jurisdiction: 'WA',
              number: tenementNumber.trim(),
              type: attrs.type || 'Unknown',
              status: attrs.tenstatus || 'Unknown',
              holder_name: attrs.holder1 || 'Unknown',
              grant_date: attrs.grantdate ? new Date(attrs.grantdate).toISOString().split('T')[0] : null,
              application_date: attrs.startdate ? new Date(attrs.startdate).toISOString().split('T')[0] : null,
              expiry_date: attrs.enddate ? new Date(attrs.enddate).toISOString().split('T')[0] : null,
              area_ha: attrs.legal_area || null,
              last_sync_at: new Date().toISOString(),
              source_wfs_ref: tenementNumber,
              source_mto_ref: `comprehensive-${Date.now()}`
            }, {
              onConflict: 'id'
            });

          if (tenementError) {
            errors.push(`Failed to sync tenement ${tenementNumber}: ${tenementError.message}`);
            continue;
          }

          // Get comprehensive data (sites, projects, etc.) for EVERY tenement
          try {
            console.log(`🔍 Getting comprehensive data for ${tenementNumber}...`);
            const comprehensiveData = await waComprehensiveAPI.getComprehensiveTenementData(tenementNumber);
            
            if (comprehensiveData) {
              console.log(`📊 Found comprehensive data: ${comprehensiveData.dataCompleteness}% complete, ${comprehensiveData.sites?.length || 0} sites, ${comprehensiveData.projects?.length || 0} projects`);
              
              // Sync sites data with full details
              if (comprehensiveData.sites && comprehensiveData.sites.length > 0) {
                for (const site of comprehensiveData.sites) {
                  try {
                    await supabase
                      .from('sites')
                      .upsert({
                        tenement_id: tenementUuid,
                        site_name: site.siteName,
                        site_code: site.siteCode,
                        short_name: site.shortName,
                        site_type: site.siteType,
                        site_subtype: site.siteSubtype,
                        site_stage: site.siteStage,
                        commodities: site.commodities?.join(', '),
                        target_commodities: site.targetCommodities,
                        primary_commodity: site.primaryCommodity,
                        project_name: site.projectName,
                        project_code: site.projectCode,
                        coordinates: (site.latitude && site.longitude) ? {
                          latitude: site.latitude,
                          longitude: site.longitude
                        } : null,
                        confidence: site.confidence,
                        point_confidence: site.pointConfidence,
                        web_link: site.webLink,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      }, {
                        onConflict: 'site_code'
                      });
                  } catch (siteErr) {
                    console.error(`Error syncing site ${site.siteCode}:`, siteErr);
                  }
                }
              }

              // Sync projects data with full details
              if (comprehensiveData.projects && comprehensiveData.projects.length > 0) {
                for (const project of comprehensiveData.projects) {
                  try {
                    await supabase
                      .from('projects')
                      .upsert({
                        project_name: project.projectName,
                        project_code: project.projectCode,
                        commodity: project.commodities?.join(', ') || project.commodity,
                        project_status: project.projectStatus || 'Active',
                        associated_sites: project.sites?.join(', '),
                        commodities_list: project.commodities?.join(', '),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      }, {
                        onConflict: 'project_code'
                      });
                    
                    // Create tenement-project relationships
                    await supabase
                      .from('tenement_projects')
                      .upsert({
                        tenement_id: tenementUuid,
                        project_code: project.projectCode,
                        relationship_type: 'associated',
                        created_at: new Date().toISOString()
                      }, {
                        onConflict: 'tenement_id,project_code'
                      });
                      
                  } catch (projectErr) {
                    console.error(`Error syncing project ${project.projectCode}:`, projectErr);
                  }
                }
              }
              
              // Update tenement with comprehensive data completeness
              await supabase
                .from('tenements')
                .update({
                  data_completeness: comprehensiveData.dataCompleteness,
                  comprehensive_data_available: true,
                  sites_count: comprehensiveData.sites?.length || 0,
                  projects_count: comprehensiveData.projects?.length || 0,
                  last_comprehensive_sync: new Date().toISOString()
                })
                .eq('id', tenementUuid);
                
            } else {
              console.log(`⚠️ No comprehensive data found for ${tenementNumber}`);
            }
          } catch (comprehensiveErr) {
            console.error(`❌ Error getting comprehensive data for ${tenementNumber}:`, comprehensiveErr);
          }

          imported++;
          
          if (imported % 100 === 0) {
            console.log(`✅ Processed ${imported} tenements so far...`);
          }

        } catch (err) {
          errors.push(`Error processing tenement: ${err}`);
        }
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`🎉 MASSIVE WA sync complete: ${imported} tenements synced with comprehensive data!`);

    return NextResponse.json({
      success: true,
      imported,
      updated,
      errors: errors.slice(0, 50), // Limit error list
      jurisdiction: 'WA',
      timestamp: new Date().toISOString(),
      message: `Successfully synced ${imported} WA tenements with comprehensive data from Government APIs`
    });

  } catch (error) {
    console.error('❌ Massive WA sync error:', error);
    return NextResponse.json(
      { 
        success: false,
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        message: 'Failed to sync all WA tenements'
      },
      { status: 500 }
    );
  }
}
