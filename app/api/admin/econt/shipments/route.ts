export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, structuredAdminErrorResponse } from '@/lib/admin-api-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { computeCodForOrder } from '@/lib/econt/shipment-service';
import { buildProductGroups } from '@/lib/econt/tracking-product-groups';
import { getEcontRuntimeEnv } from '@/lib/econt/config';
import {
  fetchShipmentQueueProductNames,
  fetchShipmentQueueProductTypes,
  orderIdsForProductName,
  orderIdsForProductTypeName,
} from '@/lib/econt/shipment-product-filter';

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
    const view = sp.get('view') ?? 'orders';
    const q = sp.get('q')?.trim() ?? '';
    const product = sp.get('product')?.trim() ?? '';
    const productType = sp.get('productType')?.trim() ?? '';
    const dateFrom = sp.get('dateFrom');
    const dateTo = sp.get('dateTo');

    if (view === 'products') {
      const { data: shipmentsWithNumbers } = await supabaseAdmin
        .from('econt_shipments')
        .select('id, order_id, shipment_number, raw_delivery_status, normalized_delivery_status')
        .not('shipment_number', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(400);
      const orderIds = [...new Set((shipmentsWithNumbers ?? []).map((row) => row.order_id).filter(Boolean))] as string[];
      let orders: Record<string, unknown>[] = [];
      if (orderIds.length) {
        const { data } = await supabaseAdmin
          .from('orders')
          .select(
            `orderid, order_items(
              quantity, price, productvariantid,
              products(name, product_types(name)),
              product_variants(product_variant_property_values(value, properties(name)))
            )`
          )
          .in('orderid', orderIds);
        orders = data ?? [];
      }
      const shipmentByOrder = new Map((shipmentsWithNumbers ?? []).map((s) => [s.order_id, s]));
      const productLinks = orders
        .map((order) => {
          const shipment = shipmentByOrder.get(String(order.orderid));
          if (!shipment) return null;
          return {
            orderId: String(order.orderid),
            shipmentNumber: shipment.shipment_number ? String(shipment.shipment_number) : null,
            status: shipment.raw_delivery_status ? String(shipment.raw_delivery_status) : String(shipment.normalized_delivery_status ?? ''),
            storedId: String(shipment.id),
          };
        })
        .filter(Boolean) as Array<{
        orderId: string;
        shipmentNumber: string | null;
        status: string | null;
        storedId: string | null;
      }>;
      const productItems = orders.flatMap((order) =>
        ((order.order_items as Array<Record<string, unknown>> | undefined) ?? []).map((item) => ({
          ...item,
          orderid: String(order.orderid),
        }))
      );
      const productGroups = buildProductGroups(productItems, productLinks);
      return NextResponse.json({
        success: true,
        environment: getEcontRuntimeEnv(),
        productGroups,
        total: productGroups.length,
      });
    }

    const [productNames, productTypeNames] = await Promise.all([
      fetchShipmentQueueProductNames(supabaseAdmin),
      fetchShipmentQueueProductTypes(supabaseAdmin),
    ]);

    let ordersQuery = supabaseAdmin
      .from('orders')
      .select(
        `orderid, status, createdat, deliverytype, econtoffice, deliverynotes,
         deliverystreet, deliverystreetnumber, subtotal, deliverycost, total, discountamount,
         customers(firstname, lastname, telephone, email, city),
         order_items(
           quantity, price, productvariantid,
           products(name, product_types(name)),
           product_variants(
             product_variant_property_values(
               value,
               properties(name)
             )
           )
         )`,
        { count: 'exact' }
      )
      .order('createdat', { ascending: false });

    if (dateFrom) ordersQuery = ordersQuery.gte('createdat', dateFrom);
    if (dateTo) ordersQuery = ordersQuery.lte('createdat', `${dateTo}T23:59:59`);

    if (q) {
      ordersQuery = ordersQuery.ilike('orderid', `%${q}%`);
    }

    const stockFilterActive = productType || product;
    if (stockFilterActive) {
      let matchingOrderIds: string[] = [];
      if (productType) {
        matchingOrderIds = await orderIdsForProductTypeName(supabaseAdmin, productType);
      } else if (product) {
        matchingOrderIds = await orderIdsForProductName(supabaseAdmin, product);
      }
      if (!matchingOrderIds.length) {
        return NextResponse.json({
          success: true,
          environment: getEcontRuntimeEnv(),
          summary: {
            withoutLabel: 0,
            pendingValidation: 0,
            readyToCreate: 0,
            created: 0,
            errors: 0,
          },
          latestCreated: null,
          page,
          pageSize,
          total: 0,
          rows: [],
          productNames,
          productTypeNames,
          productFilter: product || null,
          productTypeFilter: productType || null,
        });
      }
      ordersQuery = ordersQuery.in('orderid', matchingOrderIds);
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

    const { data: latestAudit } = await supabaseAdmin
      .from('econt_shipment_audit_logs')
      .select('shipment_id, order_id, created_at')
      .eq('operation', 'create')
      .eq('result', 'success')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let latestCreated: {
      shipmentId: string;
      orderId: string | null;
      shipmentNumber: string | null;
      createdAt: string;
    } | null = null;

    if (latestAudit?.shipment_id) {
      const { data: latestShipment } = await supabaseAdmin
        .from('econt_shipments')
        .select('id, order_id, shipment_number')
        .eq('id', latestAudit.shipment_id)
        .maybeSingle();
      if (latestShipment?.shipment_number) {
        latestCreated = {
          shipmentId: latestShipment.id,
          orderId: latestShipment.order_id ?? latestAudit.order_id ?? null,
          shipmentNumber: latestShipment.shipment_number,
          createdAt: latestAudit.created_at,
        };
      }
    }

    if (!latestCreated) {
      const { data: fallback } = await supabaseAdmin
        .from('econt_shipments')
        .select('id, order_id, shipment_number, updated_at')
        .not('shipment_number', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (fallback?.shipment_number) {
        latestCreated = {
          shipmentId: fallback.id,
          orderId: fallback.order_id ?? null,
          shipmentNumber: fallback.shipment_number,
          createdAt: fallback.updated_at,
        };
      }
    }

    return NextResponse.json({
      success: true,
      environment: getEcontRuntimeEnv(),
      summary,
      latestCreated,
      page,
      pageSize,
      total: count ?? rows.length,
      rows,
      productNames,
      productTypeNames,
      productFilter: product || null,
      productTypeFilter: productType || null,
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
