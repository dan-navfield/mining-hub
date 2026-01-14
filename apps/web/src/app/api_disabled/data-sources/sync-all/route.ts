import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting FULL SYNC of all jurisdictions...');
    
    const jurisdictions = ['WA', 'NSW', 'VIC', 'NT', 'QLD', 'TAS'];
    const results = [];
    
    for (const jurisdiction of jurisdictions) {
      try {
        console.log(`🔄 Syncing ${jurisdiction}...`);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/data-sources/sync/${jurisdiction}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const result = await response.json();
        results.push(result);
        
        if (result.success) {
          console.log(`✅ ${jurisdiction}: ${result.imported} tenements synced`);
        } else {
          console.log(`❌ ${jurisdiction}: Sync failed - ${result.message}`);
        }
        
        // Add a small delay between syncs to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error syncing ${jurisdiction}:`, error);
        results.push({
          success: false,
          imported: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          jurisdiction,
          timestamp: new Date().toISOString(),
          message: `Failed to sync ${jurisdiction}`
        });
      }
    }
    
    const totalImported = results.reduce((sum, result) => sum + result.imported, 0);
    const successfulSyncs = results.filter(result => result.success).length;
    
    console.log(`🎉 Full sync complete: ${totalImported} total tenements synced across ${successfulSyncs}/${jurisdictions.length} jurisdictions`);
    
    return NextResponse.json({
      success: true,
      totalImported,
      successfulSyncs,
      totalJurisdictions: jurisdictions.length,
      results,
      timestamp: new Date().toISOString(),
      message: `Full sync completed: ${totalImported} tenements synced across ${successfulSyncs} jurisdictions`
    });

  } catch (error) {
    console.error('❌ Full sync error:', error);
    return NextResponse.json(
      { 
        success: false,
        totalImported: 0,
        successfulSyncs: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        message: 'Full sync failed'
      },
      { status: 500 }
    );
  }
}
