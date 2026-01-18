import { NextRequest, NextResponse } from 'next/server';
import { abnLookupServerService } from '@/lib/services/abn-lookup-server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const type = searchParams.get('type') || 'auto';

  if (!query) {
    return NextResponse.json(
      { error: 'Missing query parameter' },
      { status: 400 }
    );
  }

  try {
    let result;

    if (type === 'abn' || /^\d{11}$/.test(query.replace(/\s+/g, ''))) {
      // Search by ABN
      result = await abnLookupServerService.searchByABN(query);
    } else {
      // Search by name
      result = await abnLookupServerService.searchByName(query);
    }

    if ('error' in result) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('ABN Lookup API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { abn } = body;

    if (!abn) {
      return NextResponse.json(
        { error: 'ABN is required' },
        { status: 400 }
      );
    }

    // Validate ABN format
    const isValid = abnLookupServerService.validateABN(abn);
    
    if (!isValid) {
      return NextResponse.json({
        valid: false,
        message: 'Invalid ABN format or checksum'
      });
    }

    // Look up ABN details
    const result = await abnLookupServerService.searchByABN(abn);
    
    if ('error' in result) {
      return NextResponse.json({
        valid: false,
        message: result.message,
        details: result
      });
    }

    return NextResponse.json({
      valid: true,
      message: 'Valid ABN',
      details: result
    });

  } catch (error) {
    console.error('ABN Validation API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
