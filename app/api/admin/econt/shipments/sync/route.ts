export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin-api-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { syncShipmentsByIds } from '@/lib/econt/shipment-service';
import { getEcontRuntimeEnv } from '@/lib/econt/config';

/** Vercel Cron sends `Authorization: Bearer CRON_SECRET`; manual jobs may use `x-cron-secret`. */
export function isEcontCronAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return false;
  const bearer = request.headers.get('authorization');
  if (bearer === `Bearer ${expected}`) return true;
  return request.headers.get('x-cron-secret') === expected;
}

async function handleSync(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body.shipmentIds) ? body.shipmentIds.map(String) : null;

  let targetIds = ids;
  if (!targetIds) {
    const { data } = await supabaseAdmin
      .from('econt_shipments')
      .select('id')
      .not('shipment_number', 'is', null)
      .limit(100);
    targetIds = (data ?? []).map((r) => r.id);
  }

  const run = await supabaseAdmin
    .from('econt_sync_runs')
    .insert({ sync_type: 'tracking', status: 'running' })
    .select('id')
    .single();

  const result = await syncShipmentsByIds(targetIds);
  await supabaseAdmin
    .from('econt_sync_runs')
    .update({
      status: result.failure > 0 && result.success === 0 ? 'failed' : 'completed',
      completed_at: new Date().toISOString(),
      processed_count: result.processed,
      success_count: result.success,
      failure_count: result.failure,
    })
    .eq('id', run.data?.id);

  return NextResponse.json({
    success: true,
    processed: result.processed,
    successCount: result.success,
    failureCount: result.failure,
    environment: getEcontRuntimeEnv(),
  });
}

export async function GET(request: NextRequest) {
  if (!isEcontCronAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  if (isEcontCronAuthorized(request)) {
    return handleSync(request);
  }
  return withAdminAuth(request, async () => handleSync(request));
}
