export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { runDuePaymentSync, runTrackingSync } from '@/lib/econt/sync-service';
import { getEcontRuntimeEnv } from '@/lib/econt/config';

function authorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return false;
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}

/** Read-only tracking refresh. Does not create or cancel labels. */
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          title: 'Неоторизирана заявка',
          message: 'Липсва валиден CRON_SECRET.',
          retryable: false,
        },
      },
      { status: 401 }
    );
  }

  try {
    const result = await runTrackingSync({ onlyDue: true, limit: 40 });
    const payment = await runDuePaymentSync();
    const paymentNote = payment.skipped
      ? ''
      : payment.failed
        ? ' Справката за изплащания не мина.'
        : ` Справка за изплащания: ${payment.imported} от ${payment.totalRows}.`;
    return NextResponse.json({
      success: !result.alreadyRunning,
      alreadyRunning: result.alreadyRunning,
      environment: getEcontRuntimeEnv(),
      processed: result.processed,
      successCount: result.success,
      failureCount: result.failure,
      paymentReport: payment.skipped ? 'skipped' : payment.failed ? 'failed' : 'imported',
      message: `${result.message}${paymentNote}`,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ECONT_TRACKING_UNAVAILABLE',
          title: 'Неуспешна синхронизация',
          message: 'Не успяхме да получим актуалните статуси от Еконт. Последната успешно получена информация е запазена.',
          suggestion: 'Опитайте ръчно обновяване.',
          retryable: true,
        },
      },
      { status: 503 }
    );
  }
}
