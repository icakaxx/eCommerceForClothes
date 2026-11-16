import type { SupabaseClient } from '@supabase/supabase-js';
import { orderItemProductName } from '@/lib/order-item-display';

export function productTypeNameFromOrderItem(row: { products?: unknown }): string {
  const products = row.products;
  const product = Array.isArray(products) ? products[0] : products;
  if (!product || typeof product !== 'object') return '';
  const types = (product as { product_types?: unknown }).product_types;
  const typeRow = Array.isArray(types) ? types[0] : types;
  if (!typeRow || typeof typeRow !== 'object') return '';
  return String((typeRow as { name?: string }).name ?? '').trim();
}

/** Distinct product type names (Якета, Панталони, …) from recent orders — best for daily batch picking. */
export async function fetchShipmentQueueProductTypes(
  supabase: SupabaseClient,
  options?: { recentOrderLimit?: number; windowStart?: string }
): Promise<string[]> {
  const limit = options?.recentOrderLimit ?? 800;
  let ordersQuery = supabase.from('orders').select('orderid').order('createdat', { ascending: false });
  if (options?.windowStart) ordersQuery = ordersQuery.gte('createdat', options.windowStart);
  else ordersQuery = ordersQuery.limit(limit);
  const { data: orders } = await ordersQuery;

  const orderIds = (orders ?? []).map((o) => String(o.orderid));
  if (!orderIds.length) return [];

  const { data: items } = await supabase
    .from('order_items')
    .select('products(product_types(name))')
    .in('orderid', orderIds);

  const names = new Set<string>();
  for (const row of items ?? []) {
    const name = productTypeNameFromOrderItem(row as { products?: unknown });
    if (name) names.add(name);
  }

  return [...names].sort((a, b) => a.localeCompare(b, 'bg'));
}

/** Order IDs with at least one line whose product belongs to the given product type name. */
export async function orderIdsForProductTypeName(
  supabase: SupabaseClient,
  typeName: string
): Promise<string[]> {
  const name = typeName.trim();
  if (!name) return [];

  const { data: types } = await supabase.from('product_types').select('producttypeid').eq('name', name);
  const typeIds = (types ?? []).map((t) => t.producttypeid).filter(Boolean);
  if (!typeIds.length) return [];

  const { data: products } = await supabase.from('products').select('productid').in('producttypeid', typeIds);
  const productIds = (products ?? []).map((p) => p.productid).filter(Boolean);
  if (!productIds.length) return [];

  const { data: lines } = await supabase.from('order_items').select('orderid').in('productid', productIds);
  return [...new Set((lines ?? []).map((row) => String(row.orderid)))];
}

/** Distinct catalog product names from recent order lines (for admin shipment queue dropdown). */
export async function fetchShipmentQueueProductNames(
  supabase: SupabaseClient,
  options?: { recentOrderLimit?: number; windowStart?: string }
): Promise<string[]> {
  const limit = options?.recentOrderLimit ?? 800;
  let ordersQuery = supabase.from('orders').select('orderid').order('createdat', { ascending: false });
  if (options?.windowStart) ordersQuery = ordersQuery.gte('createdat', options.windowStart);
  else ordersQuery = ordersQuery.limit(limit);
  const { data: orders } = await ordersQuery;

  const orderIds = (orders ?? []).map((o) => String(o.orderid));
  if (!orderIds.length) return [];

  const { data: items } = await supabase
    .from('order_items')
    .select('products(name)')
    .in('orderid', orderIds);

  const names = new Set<string>();
  for (const row of items ?? []) {
    const name = orderItemProductName(row as { products?: { name?: string | null } }).trim();
    if (name && name !== 'Артикул') names.add(name);
  }

  return [...names].sort((a, b) => a.localeCompare(b, 'bg'));
}

/** Order IDs that include at least one line with the given product name (exact match). */
export async function orderIdsForProductName(
  supabase: SupabaseClient,
  productName: string
): Promise<string[]> {
  const name = productName.trim();
  if (!name) return [];

  const { data: products } = await supabase.from('products').select('productid').eq('name', name);
  const productIds = (products ?? []).map((p) => p.productid).filter(Boolean);
  if (!productIds.length) return [];

  const { data: lines } = await supabase.from('order_items').select('orderid').in('productid', productIds);
  return [...new Set((lines ?? []).map((row) => String(row.orderid)))];
}