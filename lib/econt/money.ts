/** Decimal-safe money helpers (EUR, 2 dp). */

export function parseMoney(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  return roundMoney(n);
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function moneyToCents(value: number): number {
  return Math.round(roundMoney(value) * 100);
}

export function centsToMoney(cents: number): number {
  return roundMoney(cents / 100);
}

export function sumMoney(values: Array<number | null | undefined>): number {
  let cents = 0;
  for (const v of values) {
    if (v === null || v === undefined) continue;
    cents += moneyToCents(v);
  }
  return centsToMoney(cents);
}

export function formatEur(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR' }).format(value);
}
