import type { SupabaseClient } from '@supabase/supabase-js';

/** Unambiguous uppercase chars (no 0/O, 1/I/L). */
const ORDER_ID_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const ORDER_ID_LENGTH = 5;
const MAX_ATTEMPTS = 12;

export function generateOrderIdCandidate(length = ORDER_ID_LENGTH): string {
  let id = '';
  for (let i = 0; i < length; i++) {
    id += ORDER_ID_CHARS[Math.floor(Math.random() * ORDER_ID_CHARS.length)];
  }
  return id;
}

async function orderIdExists(supabase: SupabaseClient, orderId: string): Promise<boolean> {
  const { data, error } = await supabase.from('orders').select('orderid').eq('orderid', orderId).maybeSingle();
  if (error) {
    console.error('order id uniqueness check failed:', error);
    throw new Error('Failed to verify order id uniqueness');
  }
  return !!data;
}

/** Generates a unique order id (default 5 chars) with collision retries. */
export async function generateUniqueOrderId(supabase: SupabaseClient): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const id = generateOrderIdCandidate();
    if (!(await orderIdExists(supabase, id))) return id;
  }
  throw new Error('Failed to generate unique order id');
}
