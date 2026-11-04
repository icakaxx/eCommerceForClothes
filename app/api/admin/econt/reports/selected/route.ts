export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, structuredAdminErrorResponse } from '@/lib/admin-api-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { aggregateSelectedFinancials } from '@/lib/econt/reconciliation';

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const body = await request.json();
    const ids = Array.isArray(body.shipmentIds) ? body.shipmentIds.map(String) : [];
    const exportCsv = Boolean(body.exportCsv);

    if (ids.length === 0) {
      return structuredAdminErrorResponse({
        code: 'VALIDATION_FAILED',
        title: 'Няма избрани пратки',
        message: 'Изберете поне една пратка.',
        retryable: false,
        status: 400,
      });
    }

    const { data, error } = await supabaseAdmin.from('econt_shipments').select('*').in('id', ids);
    if (error) {
      return structuredAdminErrorResponse({
        code: 'DB_ERROR',
        title: 'Грешка',
        message: 'Не успяхме да заредим пратките.',
        retryable: true,
        status: 500,
      });
    }

    const totals = aggregateSelectedFinancials(
      (data ?? []).map((s) => ({
        expectedCod: s.expected_cod_amount !== null ? Number(s.expected_cod_amount) : null,
        collectedCod: s.collected_cod_amount !== null ? Number(s.collected_cod_amount) : null,
        paidCod: s.paid_cod_amount !== null ? Number(s.paid_cod_amount) : null,
        normalizedStatus: s.normalized_delivery_status,
        merchantDeliveryCost: s.merchant_delivery_cost !== null ? Number(s.merchant_delivery_cost) : null,
        collectedCurrency: s.collected_cod_currency,
        paidCurrency: s.paid_cod_currency,
        codCurrency: s.cod_currency ?? 'EUR',
      }))
    );

    if (!exportCsv) {
      return NextResponse.json({ success: true, environment: 'demo', totals, count: data?.length ?? 0 });
    }

    const header = [
      'order_id',
      'shipment_number',
      'status',
      'expected_cod',
      'collected_cod',
      'paid_cod',
      'paid_at',
      'delivery_cost',
      'last_sync',
    ];
    const lines = (data ?? []).map((s) =>
      [
        s.order_id,
        s.shipment_number ?? '',
        s.normalized_delivery_status,
        s.expected_cod_amount ?? '',
        s.collected_cod_amount ?? '',
        s.paid_cod_amount ?? '',
        s.paid_cod_at ?? '',
        s.merchant_delivery_cost ?? '',
        s.last_sync_at ?? '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = `\uFEFF${header.join(',')}\n${lines.join('\n')}`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="econt-selected-shipments.csv"',
      },
    });
  });
}
