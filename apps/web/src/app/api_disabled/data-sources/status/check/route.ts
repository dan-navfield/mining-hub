import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simulate status check delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = {
      status: 'success',
      message: 'All data sources are operational',
      timestamp: new Date().toISOString(),
      checks: {
        WA: 'Active',
        NSW: 'Active', 
        VIC: 'Active',
        NT: 'Active',
        QLD: 'Active',
        TAS: 'Active',
      }
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Status check failed' },
      { status: 500 }
    );
  }
}
