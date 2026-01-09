import { NextRequest, NextResponse } from 'next/server';
import { realDataSyncService } from '@/lib/services/real-data-sync.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { jurisdiction: string } }
) {
  try {
    const { jurisdiction } = params;

    console.log(`🚀 Starting REAL data sync for ${jurisdiction}...`);
    
    // Use the real data sync service to connect to actual government APIs
    const result = await realDataSyncService.syncJurisdiction(jurisdiction);

    if (result.success) {
      console.log(`✅ Successfully synced ${result.imported} real tenements from ${jurisdiction}`);
    } else {
      console.error(`❌ Sync failed for ${jurisdiction}:`, result.errors);
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        success: false,
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        jurisdiction: params.jurisdiction,
        timestamp: new Date().toISOString(),
        message: `Failed to sync ${params.jurisdiction} data from real APIs`
      },
      { status: 500 }
    );
  }
}
