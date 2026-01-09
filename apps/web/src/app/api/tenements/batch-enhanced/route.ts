import { NextRequest, NextResponse } from 'next/server';
import { batchEnhancedProcessor, BatchProcessingOptions } from '@/lib/services/batch-enhanced-processor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      tenementNumbers, 
      holderName,
      options = {} 
    }: { 
      tenementNumbers?: string[]; 
      holderName?: string;
      options?: BatchProcessingOptions;
    } = body;

    // Validate input
    if (!tenementNumbers && !holderName) {
      return NextResponse.json(
        { error: 'Either tenementNumbers array or holderName must be provided' },
        { status: 400 }
      );
    }

    if (tenementNumbers && (!Array.isArray(tenementNumbers) || tenementNumbers.length === 0)) {
      return NextResponse.json(
        { error: 'tenementNumbers must be a non-empty array' },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting batch enhanced processing...`);
    
    let results;
    if (holderName) {
      console.log(`📋 Processing all tenements for holder: ${holderName}`);
      results = await batchEnhancedProcessor.processHolderTenements(holderName, options);
    } else {
      console.log(`📋 Processing ${tenementNumbers!.length} specific tenements`);
      results = await batchEnhancedProcessor.processTenements(tenementNumbers!, options);
    }

    // Generate processing report
    const report = batchEnhancedProcessor.generateReport(results);

    return NextResponse.json({
      success: true,
      results,
      report,
      summary: {
        totalProcessed: results.totalProcessed,
        successful: results.successful,
        failed: results.failed,
        successRate: `${((results.successful / results.totalProcessed) * 100).toFixed(1)}%`,
        processingTimeMinutes: (results.processingTime / 1000 / 60).toFixed(2),
        dataQualityScore: `${results.dataQualityReport.dataCompletenessScore.toFixed(1)}%`
      }
    });

  } catch (error) {
    console.error('Batch enhanced processing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process batch enhanced data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const holderName = searchParams.get('holder');

  if (!holderName) {
    return NextResponse.json(
      { error: 'holder parameter is required' },
      { status: 400 }
    );
  }

  try {
    console.log(`🔍 Finding tenements for holder: ${holderName}`);
    
    // Just return the list of tenements for this holder without processing
    const { minedxEnhancedScraper } = await import('@/lib/services/minedx-enhanced-scraper');
    const tenementNumbers = await minedxEnhancedScraper.scrapeHolderTenements(holderName);

    return NextResponse.json({
      holderName,
      tenementCount: tenementNumbers.length,
      tenementNumbers
    });

  } catch (error) {
    console.error('Error finding holder tenements:', error);
    return NextResponse.json(
      { error: 'Failed to find holder tenements' },
      { status: 500 }
    );
  }
}
