export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, structuredAdminErrorResponse } from '@/lib/admin-api-auth';
import { validateEcontAddress } from '@/lib/econt/nomenclatures';
import { toStructuredError } from '@/lib/econt/errors';

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const body = await request.json();
      const result = await validateEcontAddress({
        cityId: Number(body.cityId),
        street: String(body.street ?? ''),
        num: String(body.num ?? ''),
        other: body.other ? String(body.other) : '',
      });
      if (result.validationStatus === 'invalid') {
        return structuredAdminErrorResponse({
          code: 'ECONT_INVALID_ADDRESS',
          field: 'receiverAddress',
          title: 'Невалиден адрес',
          message: 'Еконт не приема този адрес за доставка.',
          suggestion: 'Коригирайте улица и номер.',
          retryable: false,
          status: 400,
        });
      }
      return NextResponse.json({ success: true, result, environment: 'demo' });
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
