export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, structuredAdminErrorResponse } from '@/lib/admin-api-auth';
import { createShipmentLabel } from '@/lib/econt/shipment-service';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { toStructuredError } from '@/lib/econt/errors';

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (admin) => {
    try {
      const body = await request.json();
      const shipmentId = String(body.shipmentId ?? '');
      if (!shipmentId) {
        return structuredAdminErrorResponse({
          code: 'VALIDATION_FAILED',
          title: 'Липсва пратка',
          message: 'Невалиден идентификатор.',
          retryable: false,
          status: 400,
        });
      }
      const { data: shipment } = await supabaseAdmin.from('econt_shipments').select('validation_hash').eq('id', shipmentId).single();
      const validationHash = body.validationHash ?? shipment?.validation_hash;
      if (!validationHash) {
        return structuredAdminErrorResponse({
          code: 'STALE_VALIDATION',
          title: 'Липсва валидация',
          message: 'Първо валидирайте пратката.',
          retryable: false,
          status: 400,
        });
      }
      const result = await createShipmentLabel({ shipmentId, adminId: admin.id, validationHash: String(validationHash) });
      return NextResponse.json({ success: true, environment: 'demo', ...result });
    } catch (err) {
      const e = toStructuredError(err);
      return structuredAdminErrorResponse({
        code: e.code,
        field: e.field,
        title: e.title,
        message: e.message,
        suggestion: e.suggestion,
        retryable: e.retryable,
        status: e.httpStatus,
      });
    }
  });
}
