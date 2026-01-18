import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to calculate polygon centroid
function calculateCentroid(geometry: any): [number, number] | null {
  try {
    if (!geometry || !geometry.rings || !Array.isArray(geometry.rings) || geometry.rings.length === 0) {
      return null;
    }
    
    // Use the first ring (outer boundary) to calculate centroid
    const ring = geometry.rings[0];
    if (!Array.isArray(ring) || ring.length < 3) {
      return null;
    }
    
    let totalX = 0;
    let totalY = 0;
    let count = 0;
    
    for (const point of ring) {
      if (Array.isArray(point) && point.length >= 2) {
        totalX += point[0]; // longitude
        totalY += point[1]; // latitude
        count++;
      }
    }
    
    if (count === 0) return null;
    
    return [totalX / count, totalY / count]; // [longitude, latitude]
  } catch (error) {
    console.error('Error calculating centroid:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting WA sync - ALL TENEMENTS...');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Initialize progress tracking
    const updateProgress = async (status: string, progress: number, currentRecord: number, totalRecords: number, message: string, estimatedTimeRemaining?: number) => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/data-sources/sync-progress/WA`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, progress, currentRecord, totalRecords, message, estimatedTimeRemaining })
        });
      } catch (error) {
        console.error('Failed to update progress:', error);
      }
    };

    // First, get ALL WA tenements from the government API
    console.log('📡 Fetching ALL WA tenements from government API...');
    
    const tenementsApiUrl = 'https://services.slip.wa.gov.au/public/rest/services/SLIP_Public_Services/Industry_and_Mining/MapServer/3/query';
    
    // First, get the total count
    const countParams = new URLSearchParams({
      where: '1=1',
      returnCountOnly: 'true',
      f: 'json'
    });
    
    await updateProgress('syncing', 0, 0, 0, 'Getting total record count...');
    
    const countResponse = await fetch(`${tenementsApiUrl}?${countParams}`);
    const countResult = await countResponse.json();
    const totalCount = countResult.count || 0;
    
    console.log(`📊 Total WA tenements available: ${totalCount}`);
    await updateProgress('syncing', 5, 0, totalCount, `Found ${totalCount} records to sync`);
    
    // Fetch all records in batches (API limit is usually 1000-2000 per request)
    const allFeatures = [];
    const maxRecordsPerRequest = 2000;
    
    for (let offset = 0; offset < totalCount; offset += maxRecordsPerRequest) {
      console.log(`📡 Fetching records ${offset + 1} to ${Math.min(offset + maxRecordsPerRequest, totalCount)} of ${totalCount}...`);
      
      const queryParams = new URLSearchParams({
        where: '1=1',
        outFields: 'fmt_tenid,tenid,type,tenstatus,holder1,grantdate,startdate,enddate,legal_area,unit_of_me',
        f: 'json',
        returnGeometry: 'true',
        resultRecordCount: maxRecordsPerRequest.toString(),
        resultOffset: offset.toString()
      });
      
      const response = await fetch(`${tenementsApiUrl}?${queryParams}`);
      const apiResult = await response.json();
      
      if (apiResult.features && apiResult.features.length > 0) {
        allFeatures.push(...apiResult.features);
        const fetchProgress = Math.min(50, 10 + (allFeatures.length / totalCount) * 40);
        await updateProgress('syncing', fetchProgress, allFeatures.length, totalCount, `Fetching records: ${allFeatures.length}/${totalCount}`);
        console.log(`✅ Fetched ${apiResult.features.length} records (total so far: ${allFeatures.length})`);
      } else {
        console.log(`⚠️ No features returned for offset ${offset}`);
        break;
      }
      
      // Add small delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!allFeatures || allFeatures.length === 0) {
      await updateProgress('error', 0, 0, 0, 'No tenements found from WA Government API');
      return NextResponse.json({
        success: false,
        message: 'No tenements found from WA Government API',
        imported: 0,
        errors: ['No data returned from government API']
      });
    }

    console.log(`📊 Found ${allFeatures.length} WA tenements from government API`);
    
    let imported = 0;
    const errors: string[] = [];
    const batchSize = 500; // Much larger batches for speed
    const startTime = Date.now();
    
    await updateProgress('syncing', 50, allFeatures.length, allFeatures.length, 'Starting database insertion...');
    
    // Process all tenements in batches
    for (let i = 0; i < allFeatures.length; i += batchSize) {
      const batch = allFeatures.slice(i, i + batchSize);
      const batchNum = Math.floor(i/batchSize) + 1;
      const totalBatches = Math.ceil(allFeatures.length/batchSize);
      
      console.log(`🔄 Processing batch ${batchNum}/${totalBatches} (${batch.length} tenements)...`);
      
      // Calculate time-based ETA
      const elapsed = Date.now() - startTime;
      const recordsProcessed = i;
      const recordsRemaining = allFeatures.length - recordsProcessed;
      const avgTimePerRecord = recordsProcessed > 0 ? elapsed / recordsProcessed : 0;
      const estimatedTimeRemaining = avgTimePerRecord * recordsRemaining;
      
      // Update progress for database insertion phase (50% to 100%)
      const insertProgress = 50 + ((i / allFeatures.length) * 50);
      await updateProgress('syncing', insertProgress, i + batch.length, allFeatures.length, `Inserting batch ${batchNum}/${totalBatches} into database`, estimatedTimeRemaining);
      
      // Prepare batch data for bulk insert
      const batchData = [];
      const crypto = require('crypto');
      
      for (const feature of batch) {
        try {
          const attrs = feature.attributes;
          const tenementNumber = attrs.fmt_tenid || attrs.tenid;
          
          if (!tenementNumber || !tenementNumber.trim()) {
            continue;
          }

          // Generate consistent UUID
          const hash = crypto.createHash('sha256').update(`WA-${tenementNumber}`).digest('hex');
          const tenementUuid = [
            hash.substr(0, 8),
            hash.substr(8, 4),
            '4' + hash.substr(13, 3),
            ((parseInt(hash.substr(16, 1), 16) & 0x3) | 0x8).toString(16) + hash.substr(17, 3),
            hash.substr(20, 12)
          ].join('-');

          // Calculate coordinates from geometry and store full geometry
          const coordinates = calculateCentroid(feature.geometry);

          batchData.push({
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
            coordinates: coordinates,
            geometry: feature.geometry, // Store full WA Government API geometry
            last_sync_at: new Date().toISOString(),
            source_wfs_ref: tenementNumber,
            source_mto_ref: `wa-bulk-${Date.now()}`
          });
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          errors.push(`Error processing tenement ${feature.attributes?.fmt_tenid || feature.attributes?.tenid || 'unknown'}: ${errorMsg}`);
        }
      }

      // Bulk insert the entire batch
      if (batchData.length > 0) {
        const { error: batchError } = await supabase
          .from('tenements')
          .upsert(batchData, {
            onConflict: 'id'
          });

        if (batchError) {
          errors.push(`Failed to insert batch ${batchNum}: ${batchError.message}`);
        } else {
          imported += batchData.length;
        }
      }
    }

    // Final progress update
    await updateProgress('completed', 100, imported, allFeatures.length, `Sync completed: ${imported} tenements imported`);

    console.log(`🎉 WA sync complete: ${imported} tenements imported`);

    return NextResponse.json({
      success: true,
      imported,
      errors,
      jurisdiction: 'WA',
      timestamp: new Date().toISOString(),
      message: `Successfully synced ${imported} WA tenements from government API`
    });

  } catch (error) {
    console.error('WA sync error:', error);
    
    // Update progress to show error
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/data-sources/sync-progress/WA`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'error', 
          progress: 0, 
          currentRecord: 0, 
          totalRecords: 0, 
          message: 'Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error')
        })
      });
    } catch (progressError) {
      console.error('Failed to update error progress:', progressError);
    }
    
    return NextResponse.json(
      { 
        success: false,
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        jurisdiction: 'WA',
        timestamp: new Date().toISOString(),
        message: 'Failed to sync WA data'
      },
      { status: 500 }
    );
  }
}
