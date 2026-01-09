import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get sites associated with this project
    const { data: sites, error } = await supabase
      .from('sites')
      .select('*')
      .eq('project_code', code)
      .order('site_name');

    if (error) {
      console.error('Error fetching project sites:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sites' },
        { status: 500 }
      );
    }

    return NextResponse.json(sites || []);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
