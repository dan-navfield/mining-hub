import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Use service role client for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get unique statuses and types
    const [statusResult, typeResult] = await Promise.all([
      supabase
        .from('tenements')
        .select('status')
        .not('status', 'is', null),
      supabase
        .from('tenements')
        .select('type')
        .not('type', 'is', null)
    ]);

    if (statusResult.error || typeResult.error) {
      console.error('Database error:', statusResult.error || typeResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch filter options' },
        { status: 500 }
      );
    }

    const statuses = [...new Set(statusResult.data?.map(item => item.status).filter(Boolean))] as string[];
    const types = [...new Set(typeResult.data?.map(item => item.type).filter(Boolean))] as string[];

    return NextResponse.json({
      statuses: statuses.sort(),
      types: types.sort(),
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
