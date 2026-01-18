import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const commodity = searchParams.get('commodity');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let query = supabase
      .from('projects')
      .select('*')
      .order('project_name');

    // Apply filters
    if (search) {
      query = query.or(`project_name.ilike.%${search}%,project_code.ilike.%${search}%,commodity.ilike.%${search}%`);
    }

    if (status && status !== 'all') {
      query = query.eq('project_status', status);
    }

    if (commodity && commodity !== 'all') {
      query = query.or(`commodity.ilike.%${commodity}%,commodities_list.ilike.%${commodity}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: projects, error, count } = await supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .order('project_name')
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    return NextResponse.json(projects || []);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
