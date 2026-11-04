import 'server-only';

import { econtPost } from '@/lib/econt/client';
import { normalizeEcontStatus } from '@/lib/econt/status-mapper';
import type { ShipmentStatusEntry } from '@/lib/econt/types';

export async function fetchShipmentStatuses(shipmentNumbers: string[]) {
  const { data } = await econtPost<{ shipmentStatuses?: ShipmentStatusEntry[] }>(
    'Shipments/ShipmentService.getShipmentStatuses.json',
    { shipmentNumbers }
  );
  return data.shipmentStatuses ?? [];
}

export function parseEcontTimestamp(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return new Date(value);
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function mapStatusRow(row: ShipmentStatusEntry) {
  const status = row.status;
  if (!status) {
    return {
      error: row.error?.message ?? 'No status',
      normalized: 'unknown' as const,
    };
  }
  const normalized = normalizeEcontStatus(status.shortDeliveryStatus ?? status.shortDeliveryStatusEn);
  return {
    shipmentNumber: status.shipmentNumber,
    rawStatus: status.shortDeliveryStatus ?? status.shortDeliveryStatusEn ?? null,
    normalized,
    pdfURL: status.pdfURL,
    collectedAmount: status.cdCollectedAmount ?? null,
    collectedCurrency: status.cdCollectedCurrency ?? null,
    collectedAt: parseEcontTimestamp(status.cdCollectedTime),
    paidAmount: status.cdPaidAmount ?? null,
    paidCurrency: status.cdPaidCurrency ?? null,
    paidAt: parseEcontTimestamp(status.cdPaidTime),
    totalPrice: status.totalPrice ?? null,
    senderDueAmount: status.senderDueAmount ?? null,
    receiverDueAmount: status.receiverDueAmount ?? null,
    deliveryTime: parseEcontTimestamp(status.deliveryTime),
    expectedDeliveryDate: parseEcontTimestamp(status.expectedDeliveryDate),
    trackingEvents: status.trackingEvents ?? [],
  };
}
