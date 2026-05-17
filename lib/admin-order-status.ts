/** Client-safe order status helpers (no server-only imports). */

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
