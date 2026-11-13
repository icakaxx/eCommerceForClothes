export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin-api-auth';
import { getEcontRuntimeEnv } from '@/lib/econt/config';
import { runTrackingSync } from '@/lib/econt/sync-service';

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
  const ids = Array.isArray(body.shipmentIds) ? body.shipmentIds.map(String).filter(Boolean) : null;
  const onlyDue = body.onlyDue === true;

  try {
    const result = await runTrackingSync({
      shipmentIds: ids && ids.length ? ids : null,
      onlyDue,
      limit: ids?.length ? Math.min(ids.length, 80) : 40,
    });
    const status = result.alreadyRunning ? 409 : 200;
    return NextResponse.json(
      {
        success: !result.alreadyRunning,
        alreadyRunning: result.alreadyRunning,
        processed: result.processed,
        successCount: result.success,
        failureCount: result.failure,
        message: result.message,
        environment: getEcontRuntimeEnv(),
      },
      { status }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ECONT_TRACKING_UNAVAILABLE',
          title: 'Неуспешна синхронизация',
          message: 'В момента не можем да обновим статуса от Еконт. Последната успешно получена информация е запазена.',
          retryable: true,
        },
      },
      { status: 503 }
    );
  }
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
