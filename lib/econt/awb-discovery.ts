import 'server-only';

import { econtPost } from '@/lib/econt/client';

function numbersFrom(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return '';
      const row = item as Record<string, unknown>;
      const direct = row.shipmentNumber ?? row.shipment_number;
      return direct === null || direct === undefined ? '' : String(direct);
    })
    .filter(Boolean);
}

/** Read-only list of sender AWBs. Does not create or import shipments. */
export async function fetchSenderAwbNumbers(dateFrom: string, dateTo: string): Promise<string[]> {
  const numbers = new Set<string>();
  for (let page = 1; page <= 8; page += 1) {
    const { data } = await econtPost<Record<string, unknown>>(
      'Shipments/ShipmentService.getMyAWB.json',
      { dateFrom, dateTo, page, side: 'sender' }
    );
    const batch = [
      ...numbersFrom(data.results),
      ...numbersFrom(data.shipments),
      ...numbersFrom(data.awbs),
    ];
    if (batch.length === 0) break;
    const before = numbers.size;
    batch.forEach((num) => numbers.add(num));
    if (numbers.size === before) break;
  }
  return [...numbers];
}
