/** Scheduling and office-wait rules. Pure functions — no Econt calls. */

export const SYNC_INTERVALS_MS = {
  active: 5 * 60 * 1000,
  deliveredIncomplete: 10 * 60 * 1000,
  deliveredComplete: 6 * 60 * 60 * 1000,
  paymentReport: 30 * 60 * 1000,
  lockLease: 8 * 60 * 1000,
} as const;

const ACTIVE = new Set(['prepared', 'accepted', 'in_transit', 'in_office', 'out_for_delivery', 'returning']);

export type SyncCandidate = {
  id: string;
  normalizedStatus: string | null;
  lastSuccessfulSyncAt: string | null;
  collectedCod: number | null;
  paidCod: number | null;
};

export function financialDataComplete(row: Pick<SyncCandidate, 'collectedCod' | 'paidCod'>): boolean {
  return row.collectedCod !== null && row.paidCod !== null;
}

export function syncIntervalMs(row: SyncCandidate): number {
  if (row.normalizedStatus === 'delivered' && financialDataComplete(row)) {
    return SYNC_INTERVALS_MS.deliveredComplete;
  }
  if (row.normalizedStatus === 'delivered') {
    return SYNC_INTERVALS_MS.deliveredIncomplete;
  }
  if (row.normalizedStatus && ACTIVE.has(row.normalizedStatus)) {
    return SYNC_INTERVALS_MS.active;
  }
  return SYNC_INTERVALS_MS.deliveredIncomplete;
}

export function isSyncDue(row: SyncCandidate, now: Date): boolean {
  if (!row.lastSuccessfulSyncAt) return true;
  const last = new Date(row.lastSuccessfulSyncAt).getTime();
  if (Number.isNaN(last)) return true;
  return now.getTime() - last >= syncIntervalMs(row);
}

export function isPaymentReportDue(lastStartedAt: string | null, now: Date): boolean {
  if (!lastStartedAt) return true;
  const last = new Date(lastStartedAt).getTime();
  if (Number.isNaN(last)) return true;
  return now.getTime() - last >= SYNC_INTERVALS_MS.paymentReport;
}

export function priorityRank(status: string | null): number {
  if (status && ACTIVE.has(status) && status !== 'returning') return 0;
  if (status === 'returning') return 1;
  if (status === 'delivered') return 2;
  return 3;
}

export function selectDueShipmentIds(rows: SyncCandidate[], now: Date, limit = 40): string[] {
  return rows
    .filter((row) => isSyncDue(row, now))
    .sort((a, b) => priorityRank(a.normalizedStatus) - priorityRank(b.normalizedStatus))
    .slice(0, limit)
    .map((row) => row.id);
}

export function officeWaitDays(arrivalIso: string | null, now: Date): number | null {
  if (!arrivalIso) return null;
  const arrival = new Date(arrivalIso).getTime();
  if (Number.isNaN(arrival)) return null;
  const ms = now.getTime() - arrival;
  if (ms < 0) return 0;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export function officeWaitPriority(days: number | null): 'unknown' | 'ok' | 'watch' | 'contact' | 'high' {
  if (days === null) return 'unknown';
  if (days >= 4) return 'high';
  if (days >= 3) return 'contact';
  if (days >= 2) return 'watch';
  return 'ok';
}

export function csvCell(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value);
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}
