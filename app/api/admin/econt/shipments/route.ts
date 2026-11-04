export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, structuredAdminErrorResponse } from '@/lib/admin-api-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { computeCodForOrder } from '@/lib/econt/shipment-service';

function labelState(shipment: Record<string, unknown> | null | undefined) {
  if (!shipment) return 'without_label';
  if (shipment.shipment_number) return 'created';
  if (shipment.creation_state === 'failed' || shipment.creation_state === 'uncertain') return 'error';
  if (shipment.validation_state === 'valid') return 'ready';
  if (shipment.validation_state === 'error') return 'validation_error';
  return 'draft';
}

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const sp = request.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get('page') ?? 1));
    const pageSize = Math.min(50, Math.max(5, Number(sp.get('pageSize') ?? 20)));
    const filter = sp.get('filter') ?? 'all';
    const q = sp.get('q')?.trim() ?? '';
    const dateFrom = sp.get('dateFrom');
    const dateTo = sp.get('dateTo');

    let ordersQuery = supabaseAdmin
      .from('orders')
      .select(
        `orderid, status, createdat, deliverytype, econtoffice, subtotal, deliverycost, total, discountamount,
         customers(firstname, lastname, telephone, email, city),
         order_items(quantity, price, products(name))`,
        { count: 'exact' }
      )
      .order('createdat', { ascending: false });

    if (dateFrom) ordersQuery = ordersQuery.gte('createdat', dateFrom);
    if (dateTo) ordersQuery = ordersQuery.lte('createdat', `${dateTo}T23:59:59`);

    if (q) {
      ordersQuery = ordersQuery.ilike('orderid', `%${q}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data: orders, error, count } = await ordersQuery.range(from, to);
    if (error) {
      return structuredAdminErrorResponse({
        code: 'DB_ERROR',
        title: 'Грешка при зареждане',
        message: 'Не успяхме да заредим поръчките.',
        retryable: true,
        status: 500,
      });
    }

    const orderIds = (orders ?? []).map((o) => o.orderid);
    const { data: shipments } = await supabaseAdmin
      .from('econt_shipments')
      .select('*')
      .in('order_id', orderIds.length ? orderIds : ['__none__']);

    const shipmentByOrder = new Map((shipments ?? []).map((s) => [s.order_id, s]));

    let rows = (orders ?? []).map((order) => {
      const shipment = shipmentByOrder.get(order.orderid) ?? null;
      const cod = shipment?.expected_cod_amount ?? computeCodForOrder(order as Record<string, unknown>);
      return {
        order,
        shipment,
        labelState: labelState(shipment),
        codAmount: cod,
      };
    });

    if (filter !== 'all') {
      rows = rows.filter((r) => {
        if (filter === 'without_label') return r.labelState === 'without_label' || r.labelState === 'draft';
        if (filter === 'ready') return r.labelState === 'ready';
        if (filter === 'validation_error') return r.labelState === 'validation_error';
        if (filter === 'created') return r.labelState === 'created';
        if (filter === 'errors') return r.labelState === 'error';
        return true;
      });
    }

    const { data: allShipments } = await supabaseAdmin.from('econt_shipments').select('creation_state, validation_state, shipment_number');
    const summary = {
      withoutLabel: (allShipments ?? []).filter((s) => !s.shipment_number && s.creation_state === 'draft').length,
      pendingValidation: (allShipments ?? []).filter((s) => !s.shipment_number && s.validation_state !== 'valid').length,
      readyToCreate: (allShipments ?? []).filter((s) => !s.shipment_number && s.validation_state === 'valid').length,
      created: (allShipments ?? []).filter((s) => s.shipment_number).length,
      errors: (allShipments ?? []).filter((s) => s.creation_state === 'failed' || s.creation_state === 'uncertain').length,
    };

    return NextResponse.json({
      success: true,
      environment: 'demo',
      summary,
      page,
      pageSize,
      total: count ?? rows.length,
      rows,
    });
  });
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const body = await request.json();
    const orderId = String(body.orderId ?? '');
    if (!orderId) {
      return structuredAdminErrorResponse({
        code: 'VALIDATION_FAILED',
        title: 'Липсва поръчка',
        message: 'Изберете поръчка.',
        retryable: false,
        status: 400,
      });
    }
    const { ensureDraftShipment } = await import('@/lib/econt/shipment-service');
    try {
      const shipment = await ensureDraftShipment(orderId);
      return NextResponse.json({ success: true, shipment });
    } catch (err) {
      const { toStructuredError } = await import('@/lib/econt/errors');
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
