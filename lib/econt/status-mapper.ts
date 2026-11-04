import type { NormalizedShipmentStatus } from '@/lib/econt/types';

export function normalizeEcontStatus(raw?: string | null): NormalizedShipmentStatus {
  if (!raw) return 'unknown';
  const s = raw.toLowerCase();

  if (s.includes('cancel')) return 'cancelled';
  if (s.includes('връща') || s.includes('returning') || s.includes('return to')) return 'returning';
  if (s.includes('върнат') || (s.includes('returned') && !s.includes('returning'))) return 'returned';
  if (s.includes('deliver') && !s.includes('out')) return 'delivered';
  if (s.includes('out for') || s.includes('куриер')) return 'out_for_delivery';
  if (s.includes('office') || s.includes('офис')) return 'in_office';
  if (s.includes('transit') || s.includes('пътува') || s.includes('превоз')) return 'in_transit';
  if (s.includes('accept') || s.includes('приета') || s.includes('registered')) return 'accepted';
  if (s.includes('prepar') || s.includes('чака')) return 'prepared';

  return 'unknown';
}

export const STATUS_LABELS_BG: Record<NormalizedShipmentStatus, string> = {
  prepared: 'Подготвена',
  accepted: 'Приета от Еконт',
  in_transit: 'В движение',
  in_office: 'В офис',
  out_for_delivery: 'За доставка',
  delivered: 'Доставена',
  returning: 'Връща се',
  returned: 'Върната',
  cancelled: 'Отказана',
  unknown: 'Неизвестен',
};
