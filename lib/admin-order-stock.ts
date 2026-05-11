import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const TRACKING_ORDER_STATUSES = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
  'new',
  'prepared',
  'sent',
  'picked_up',
  'returned',
  'waiting_for_stock',
] as const;

export type TrackingOrderStatus = (typeof TRACKING_ORDER_STATUSES)[number];

export function normalizeOrderStatus(status: string): string {
  return String(status || '').trim().toLowerCase();
}

export function isValidTrackingStatus(status: string): status is TrackingOrderStatus {
  return (TRACKING_ORDER_STATUSES as readonly string[]).includes(normalizeOrderStatus(status));
}

export function isReturnedStatus(status: string): boolean {
  return normalizeOrderStatus(status) === 'returned';
}

export async function recordStockMovement(params: {
  productvariantid: string;
  movement_type: string;
  quantity_change: number;
  related_order_id?: string | null;
  note?: string | null;
  reason?: string | null;
  created_by?: string | null;
  client?: SupabaseClient;
}): Promise<void> {
  const client = params.client ?? supabaseAdmin;
  const { error } = await client.from('stock_movements').insert({
    productvariantid: params.productvariantid,
    movement_type: params.movement_type,
    quantity_change: params.quantity_change,
    related_order_id: params.related_order_id ?? null,
    note: params.note ?? null,
    reason: params.reason ?? null,
    created_by: params.created_by ?? null,
  });
  if (error && error.code !== '42P01') {
    console.warn('stock_movements insert failed (table may not exist yet):', error.message);
  }
}

export async function adjustVariantQuantityByDelta(params: {
  productvariantid: string;
  delta: number;
  movement_type: string;
  related_order_id?: string | null;
  note?: string | null;
  allowNegative?: boolean;
  created_by?: string | null;
}): Promise<{ ok: boolean; newQuantity?: number; error?: string }> {
  const { data: variant, error: fetchError } = await supabaseAdmin
    .from('product_variants')
    .select('quantity, trackquantity, productvariantid')
    .eq('productvariantid', params.productvariantid)
    .single();

  if (fetchError || !variant) {
    return { ok: false, error: fetchError?.message || 'Variant not found' };
  }

  if (variant.trackquantity === false) {
    return { ok: true, newQuantity: Number(variant.quantity) || 0 };
  }

  const current = Number(variant.quantity) || 0;
  const next = current + params.delta;
  if (!params.allowNegative && next < 0) {
    return { ok: false, error: 'Quantity cannot be negative' };
  }

  const { error: updateError } = await supabaseAdmin
    .from('product_variants')
    .update({
      quantity: next,
      updatedat: new Date().toISOString(),
    })
    .eq('productvariantid', params.productvariantid);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  await recordStockMovement({
    productvariantid: params.productvariantid,
    movement_type: params.movement_type,
    quantity_change: params.delta,
    related_order_id: params.related_order_id,
    note: params.note,
    created_by: params.created_by,
  });

  return { ok: true, newQuantity: next };
}

type OrderItemRow = {
  productvariantid?: string | null;
  quantity?: number | null;
};

export async function decreaseStockForOrderItems(params: {
  orderId: string;
  items: OrderItemRow[];
  movementType: 'order_created' | 'order_unreturned';
  created_by?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  for (const item of params.items) {
    const vid = item.productvariantid;
    const qty = Number(item.quantity) || 0;
    if (!vid || qty <= 0) continue;
    const res = await adjustVariantQuantityByDelta({
      productvariantid: vid,
      delta: -qty,
      movement_type: params.movementType,
      related_order_id: params.orderId,
      allowNegative: true,
      created_by: params.created_by,
    });
    if (!res.ok) return res;
  }
  return { ok: true };
}

export async function increaseStockForOrderItems(params: {
  orderId: string;
  items: OrderItemRow[];
  movementType: 'order_returned';
  created_by?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  for (const item of params.items) {
    const vid = item.productvariantid;
    const qty = Number(item.quantity) || 0;
    if (!vid || qty <= 0) continue;
    const res = await adjustVariantQuantityByDelta({
      productvariantid: vid,
      delta: qty,
      movement_type: params.movementType,
      related_order_id: params.orderId,
      allowNegative: true,
      created_by: params.created_by,
    });
    if (!res.ok) return res;
  }
  return { ok: true };
}
