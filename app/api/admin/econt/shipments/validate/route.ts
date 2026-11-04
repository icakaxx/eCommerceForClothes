export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, structuredAdminErrorResponse } from '@/lib/admin-api-auth';
import { validateAndPersistShipment } from '@/lib/econt/shipment-service';
import { toStructuredError } from '@/lib/econt/errors';
import type { ShipmentDraftConfig } from '@/lib/econt/types';

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (admin) => {
    try {
      const body = await request.json();
      const shipmentId = String(body.shipmentId ?? '');
      const draft = (body.draft ?? {}) as ShipmentDraftConfig;
      if (!shipmentId) {
        return structuredAdminErrorResponse({
          code: 'VALIDATION_FAILED',
          title: 'Липсва пратка',
          message: 'Невалиден идентификатор на пратка.',
          retryable: false,
          status: 400,
        });
      }
      const result = await validateAndPersistShipment({ shipmentId, adminId: admin.id, draft });
      return NextResponse.json({
        success: true,
        environment: 'demo',
        validationHash: result.validationHash,
        shipmentId,
        codAmount: result.codAmount,
        computedCod: result.computed,
        econt: result.apiResult,
      });
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
