import { NextRequest, NextResponse } from 'next/server';

// In-memory progress tracking (in production, use Redis or similar)
const syncProgress = new Map<string, {
  status: 'idle' | 'syncing' | 'completed' | 'error';
  progress: number;
  currentRecord: number;
  totalRecords: number;
  message: string;
  startTime: number;
  estimatedTimeRemaining?: number;
}>();

export async function GET(
  request: NextRequest,
  { params }: { params: { jurisdiction: string } }
) {
  const { jurisdiction } = params;
  
  const progress = syncProgress.get(jurisdiction) || {
    status: 'idle',
    progress: 0,
    currentRecord: 0,
    totalRecords: 0,
    message: 'Ready to sync',
    startTime: 0
  };

  // Calculate estimated time remaining
  if (progress.status === 'syncing' && progress.currentRecord > 0) {
    const elapsed = Date.now() - progress.startTime;
    const recordsPerMs = progress.currentRecord / elapsed;
    const remainingRecords = progress.totalRecords - progress.currentRecord;
    progress.estimatedTimeRemaining = Math.round(remainingRecords / recordsPerMs);
  }

  return NextResponse.json(progress);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { jurisdiction: string } }
) {
  const { jurisdiction } = params;
  const body = await request.json();
  
  syncProgress.set(jurisdiction, {
    ...body,
    startTime: body.status === 'syncing' && !syncProgress.get(jurisdiction)?.startTime 
      ? Date.now() 
      : (syncProgress.get(jurisdiction)?.startTime || Date.now())
  });

  return NextResponse.json({ success: true });
}
