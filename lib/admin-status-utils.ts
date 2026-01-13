/**
 * Admin Status Utilities
 * 
 * Maps order/product statuses to semantic Badge variants
 * for consistent color usage across admin panel.
 */

import { BadgeVariant } from '@/app/admin/components/Badge';

/**
 * Map order status to Badge variant
 * - delivered/completed -> success
 * - shipped -> info
 * - confirmed -> primary
 * - pending -> warning
 * - cancelled/rejected -> danger
 */
export function getOrderStatusVariant(status: string): BadgeVariant {
  const normalized = status.toLowerCase();
  
  if (normalized === 'delivered' || normalized === 'completed') {
    return 'success';
  }
  if (normalized === 'shipped') {
    return 'info';
  }
  if (normalized === 'confirmed') {
    return 'primary';
  }
  if (normalized === 'pending' || normalized === 'processing' || normalized === 'awaiting') {
    return 'warning';
  }
  if (normalized === 'cancelled' || normalized === 'rejected' || normalized === 'refunded') {
    return 'danger';
  }
  
  return 'neutral';
}
