import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Use service role client for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get counts for each jurisdiction efficiently
    const stats: Record<string, number> = {};
    const jurisdictions = ['WA', 'NSW', 'VIC', 'NT', 'QLD', 'TAS'];
    
    for (const jurisdiction of jurisdictions) {
      const { count, error } = await supabase
        .from('tenements')
        .select('*', { count: 'exact', head: true })
        .eq('jurisdiction', jurisdiction);
      
      if (error) {
        console.error(`Error counting ${jurisdiction} tenements:`, error);
        stats[jurisdiction] = 0;
      } else {
        stats[jurisdiction] = count || 0;
      }
    }

    return NextResponse.json(stats);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
