// app/api/admin/collect/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { runCollection } from '@/lib/services/collector';

// 简单鉴权：检查查询参数中的 secret
function isValidAdminRequest(request: NextRequest): boolean {
  const { searchParams } = new URL(request.url);
  const providedSecret = searchParams.get('secret');
  const adminSecret = process.env.CRON_SECRET || 'admin';

  return providedSecret === adminSecret;
}

export async function GET(request: NextRequest) {
  if (!isValidAdminRequest(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Add ?secret=YOUR_SECRET to URL' },
      { status: 401 }
    );
  }

  try {
    const result = await runCollection();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Admin Collect] Error:', error);
    return NextResponse.json(
      { error: 'Collection failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
