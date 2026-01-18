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

    // Get tenements associated with this project through the relationship table
    const { data: tenements, error } = await supabase
      .from('tenement_projects')
      .select(`
        tenements (
          id,
          number,
          type,
          status,
          holder_name,
          area_ha,
          jurisdiction
        )
      `)
      .eq('project_code', code);

    if (error) {
      console.error('Error fetching project tenements:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tenements' },
        { status: 500 }
      );
    }

    // Extract the tenement data from the nested structure
    const tenementData = tenements?.map(item => item.tenements).filter(Boolean) || [];

    return NextResponse.json(tenementData);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
