export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, structuredAdminErrorResponse } from '@/lib/admin-api-auth';
import { searchEcontOffices } from '@/lib/econt/nomenclatures';
import { isEcontConfigured, getEcontRuntimeEnv } from '@/lib/econt/config';
import { toStructuredError } from '@/lib/econt/errors';

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    if (!isEcontConfigured()) {
      return structuredAdminErrorResponse({
        code: 'ECONT_NOT_CONFIGURED',
        title: 'Econt Demo не е конфигуриран',
        message: 'Липсват ECONT_* променливи в средата на сървъра.',
        retryable: false,
        status: 503,
      });
    }
    const cityId = Number(request.nextUrl.searchParams.get('cityId'));
    if (!cityId) {
      return structuredAdminErrorResponse({
        code: 'VALIDATION_FAILED',
        title: 'Липсва град',
        message: 'Изберете град преди офисите.',
        retryable: false,
        status: 400,
      });
    }
    try {
      const q = request.nextUrl.searchParams.get('q') ?? '';
      const offices = await searchEcontOffices(cityId, q, 80);
      return NextResponse.json({ success: true, offices, environment: getEcontRuntimeEnv() });
    } catch (err) {
      const e = toStructuredError(err);
      return structuredAdminErrorResponse({
        code: e.code,
        title: e.title,
        message: e.message,
        suggestion: e.suggestion,
        retryable: e.retryable,
        status: e.httpStatus,
      });
    }
  });
}
