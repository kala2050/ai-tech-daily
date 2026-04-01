// app/api/cron/collect/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { runCollection } from '@/lib/services/collector';

// 验证 Cron Job 来源
function isValidCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('CRON_SECRET not set, allowing request');
    return true;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // 验证请求
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runCollection();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Collect] Error:', error);
    return NextResponse.json(
      { error: 'Collection failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
