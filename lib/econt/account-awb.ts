import 'server-only';

import { econtPost } from '@/lib/econt/client';
import { classifyAwbStatus, plainEcontStatus, type AwbKind } from '@/lib/econt/tracking-dashboard';

export type AccountAwb = {
  shipmentNumber: string;
  side: 'sender' | 'receiver';
  plainStatus: string;
  kind: AwbKind;
  createdAt: string | null;
  createdMs: number | null;
  cdAmount: number | null;
  cdCurrency: string | null;
};

const CACHE_MS = 60_000;
let cache: { at: number; rows: AccountAwb[] } | null = null;

function asRows(data: Record<string, unknown>): Record<string, unknown>[] {
  const list = data.results ?? data.shipments ?? data.awbs;
  return Array.isArray(list) ? (list as Record<string, unknown>[]) : [];
}

function createdMs(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function money(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const amount = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(amount) ? amount : null;
}

async function fetchSide(side: 'sender' | 'receiver'): Promise<AccountAwb[]> {
  const rows: AccountAwb[] = [];
  for (let page = 1; page <= 12; page += 1) {
    const { data } = await econtPost<Record<string, unknown>>('Shipments/ShipmentService.getMyAWB.json', { page, side });
    const batch = asRows(data);
    if (batch.length === 0) break;
    for (const row of batch) {
      const shipmentNumber = row.shipmentNumber ?? row.shipment_number;
      if (shipmentNumber === null || shipmentNumber === undefined || shipmentNumber === '') continue;
      const ms = createdMs(row.createdDate ?? row.acceptedDate);
      const status = typeof row.status === 'string' ? row.status : '';
      rows.push({
        shipmentNumber: String(shipmentNumber),
        side,
        plainStatus: plainEcontStatus(status) || 'Без статус от Еконт',
        kind: classifyAwbStatus(status),
        createdAt: ms === null ? null : new Date(ms).toISOString(),
        createdMs: ms,
        cdAmount: money(row.cdAmount),
        cdCurrency: typeof row.cdCurrency === 'string' ? row.cdCurrency : null,
      });
    }
    const totalPages = Number(data.totalPages ?? 0);
    if (totalPages && page >= totalPages) break;
  }
  return rows;
}

/** Read-only account list. Does not import or create shipments. */
export async function fetchAccountAwbs(): Promise<AccountAwb[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.rows;
  const [sender, receiver] = await Promise.all([fetchSide('sender'), fetchSide('receiver')]);
  const rows = [...sender, ...receiver];
  cache = { at: Date.now(), rows };
  return rows;
}
