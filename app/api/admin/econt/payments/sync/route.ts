export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, structuredAdminErrorResponse } from '@/lib/admin-api-auth';
import { fetchPaymentReport, isCodReportRow } from '@/lib/econt/payments';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { toStructuredError } from '@/lib/econt/errors';

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const dateFrom = request.nextUrl.searchParams.get('dateFrom');
    const dateTo = request.nextUrl.searchParams.get('dateTo');
    if (!dateFrom || !dateTo) {
      return structuredAdminErrorResponse({
        code: 'VALIDATION_FAILED',
        title: 'Липсва период',
        message: 'Изберете dateFrom и dateTo.',
        retryable: false,
        status: 400,
      });
    }
    try {
      const rows = await fetchPaymentReport(dateFrom, dateTo);
      const codRows = rows.filter(isCodReportRow);
      if (codRows.length === 0) {
        return NextResponse.json({
          success: true,
          environment: 'demo',
          message: 'Няма налични тестови данни за изплащания за избрания период.',
          rows: [],
        });
      }
      return NextResponse.json({ success: true, environment: 'demo', rows: codRows });
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

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const body = await request.json();
    const dateFrom = String(body.dateFrom ?? '');
    const dateTo = String(body.dateTo ?? '');
    try {
      const rows = (await fetchPaymentReport(dateFrom, dateTo)).filter(isCodReportRow);
      let imported = 0;
      for (const row of rows) {
        const shipmentNumber = String(row.num ?? '');
        if (!shipmentNumber) continue;
        const { data: shipment } = await supabaseAdmin
          .from('econt_shipments')
          .select('id')
          .eq('shipment_number', shipmentNumber)
          .maybeSingle();
        const paidAt = row.payDate ? new Date(row.payDate).toISOString() : null;
        const { error } = await supabaseAdmin.from('econt_payment_reports').upsert(
          {
            shipment_id: shipment?.id ?? null,
            shipment_number: shipmentNumber,
            payment_type: row.type ?? null,
            payout_method: row.payType ?? null,
            paid_amount: row.amount ?? 0,
            currency: row.currency ?? 'EUR',
            paid_at: paidAt,
            source_document_created_at: row.createdTime ? new Date(row.createdTime).toISOString() : null,
            raw_report_data: row,
          },
          { onConflict: 'shipment_number,source_type,payment_type,paid_amount,currency,paid_at', ignoreDuplicates: true }
        );
        if (!error) imported += 1;
      }
      return NextResponse.json({
        success: true,
        environment: 'demo',
        imported,
        totalRows: rows.length,
        empty: rows.length === 0,
        message: rows.length === 0 ? 'Няма налични тестови данни за изплащания.' : undefined,
      });
    } catch (err) {
      const e = toStructuredError(err);
      return structuredAdminErrorResponse({
        code: e.code,
        title: e.title,
        message: e.message,
        retryable: e.retryable,
        status: e.httpStatus,
      });
    }
  });
}
