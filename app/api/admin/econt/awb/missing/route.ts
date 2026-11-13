export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, structuredAdminErrorResponse } from '@/lib/admin-api-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { fetchSenderAwbNumbers } from '@/lib/econt/awb-discovery';
import { diffAwbNumbers } from '@/lib/econt/tracking-dashboard';
import { getEcontRuntimeEnv } from '@/lib/econt/config';
import { toStructuredError } from '@/lib/econt/errors';

/** Compare Econt sender AWBs with stored numbers. Read-only. Does not import. */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const dateFrom = request.nextUrl.searchParams.get('dateFrom');
    const dateTo = request.nextUrl.searchParams.get('dateTo');
    if (!dateFrom || !dateTo) {
      return structuredAdminErrorResponse({
        code: 'VALIDATION_FAILED',
        title: 'Липсва период',
        message: 'Изберете период за проверка на липсващи товарителници.',
        retryable: false,
        status: 400,
      });
    }

    try {
      const remote = await fetchSenderAwbNumbers(dateFrom, dateTo);
      const { data, error } = await supabaseAdmin
        .from('econt_shipments')
        .select('shipment_number, created_at')
        .not('shipment_number', 'is', null)
        .gte('created_at', `${dateFrom}T00:00:00.000Z`)
        .lte('created_at', `${dateTo}T23:59:59.999Z`);
      if (error) {
        return structuredAdminErrorResponse({
          code: 'DB_ERROR',
          title: 'Грешка при зареждане',
          message: 'Не успяхме да сравним номерата със записаните пратки.',
          retryable: true,
          status: 500,
        });
      }
      const diff = diffAwbNumbers(
        remote,
        (data ?? []).map((row) => String(row.shipment_number))
      );
      return NextResponse.json({
        success: true,
        environment: getEcontRuntimeEnv(),
        remoteCount: remote.length,
        storedInRange: data?.length ?? 0,
        missingLocally: diff.missingLocally,
        onlyLocal: diff.onlyLocal,
        note: 'Само за четене. Нищо не се импортира и не се създава товарителница.',
      });
    } catch (err) {
      const mapped = toStructuredError(err);
      return structuredAdminErrorResponse({
        code: mapped.code,
        title: 'Проверката за липсващи товарителници не мина',
        message: mapped.message || 'Еконт не върна списък getMyAWB за този акаунт.',
        suggestion: 'Проверете дали API потребителят има достъп до ShipmentService.getMyAWB.',
        retryable: mapped.retryable,
        status: mapped.httpStatus,
      });
    }
  });
}
