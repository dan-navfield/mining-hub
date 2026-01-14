import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const holderName = searchParams.get('name');

    if (!holderName) {
      return NextResponse.json({ error: 'Holder name is required' }, { status: 400 });
    }

    const { data: contactInfo, error } = await supabase
      .from('holder_contact_info')
      .select('*')
      .eq('holder_name', holderName)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!contactInfo) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(contactInfo);
  } catch (error) {
    console.error('Error getting holder contact info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contactInfo = await request.json();

    if (!contactInfo.holder_name) {
      return NextResponse.json({ error: 'Holder name is required' }, { status: 400 });
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from('holder_contact_info')
      .upsert({
        holder_name: contactInfo.holder_name,
        abn: contactInfo.abn,
        address: contactInfo.address,
        contact_email: contactInfo.contact_email,
        contact_phone: contactInfo.contact_phone,
        website: contactInfo.website,
        notes: contactInfo.notes,
        data_source: 'manual',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error saving holder contact info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
