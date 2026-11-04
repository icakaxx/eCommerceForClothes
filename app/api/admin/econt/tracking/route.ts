export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, structuredAdminErrorResponse } from '@/lib/admin-api-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { STATUS_LABELS_BG } from '@/lib/econt/status-mapper';

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const sp = request.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get('page') ?? 1));
    const pageSize = Math.min(50, Math.max(5, Number(sp.get('pageSize') ?? 20)));
    const status = sp.get('status');
    const q = sp.get('q')?.trim() ?? '';

    let query = supabaseAdmin
      .from('econt_shipments')
      .select('*, orders(orderid, createdat, deliverycost, customers(firstname, lastname, city))', { count: 'exact' })
      .not('shipment_number', 'is', null)
      .order('updated_at', { ascending: false });

    if (status && status !== 'all') query = query.eq('normalized_delivery_status', status);
    if (q) query = query.or(`shipment_number.ilike.%${q}%,order_id.ilike.%${q}%`);

    const from = (page - 1) * pageSize;
    const { data, error, count } = await query.range(from, from + pageSize - 1);
    if (error) {
      return structuredAdminErrorResponse({
        code: 'DB_ERROR',
        title: 'Грешка при зареждане',
        message: 'Не успяхме да заредим пратките.',
        retryable: true,
        status: 500,
      });
    }

    const { data: all } = await supabaseAdmin.from('econt_shipments').select('normalized_delivery_status, collected_cod_amount, paid_cod_amount, expected_cod_amount, last_sync_at');
    const summary = {
      all: all?.length ?? 0,
      inTransit: (all ?? []).filter((s) => s.normalized_delivery_status === 'in_transit').length,
      inOffice: (all ?? []).filter((s) => s.normalized_delivery_status === 'in_office').length,
      delivered: (all ?? []).filter((s) => s.normalized_delivery_status === 'delivered').length,
      returning: (all ?? []).filter((s) => s.normalized_delivery_status === 'returning').length,
      returned: (all ?? []).filter((s) => s.normalized_delivery_status === 'returned').length,
      collectedCod: (all ?? []).filter((s) => s.collected_cod_amount !== null).length,
      paidCod: (all ?? []).filter((s) => s.paid_cod_amount !== null).length,
      awaitingPayout: (all ?? []).filter(
        (s) => s.collected_cod_amount !== null && s.paid_cod_amount === null
      ).length,
      lastSyncAt: (all ?? []).reduce<string | null>((max, s) => {
        if (!s.last_sync_at) return max;
        if (!max || s.last_sync_at > max) return s.last_sync_at;
        return max;
      }, null),
    };

    return NextResponse.json({
      success: true,
      environment: 'demo',
      statusLabels: STATUS_LABELS_BG,
      summary,
      page,
      pageSize,
      total: count ?? 0,
      shipments: data ?? [],
    });
  });
}
