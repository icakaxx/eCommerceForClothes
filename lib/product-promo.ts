/** Percentage off original price (1–99). Null/0 = no active promo. */
export type PromoDiscountSource = {
  promodiscountpercent?: number | null;
  promoDiscountPercent?: number | null;
};

/** Parse admin/API values like 20, "20", "20%", "20,5". */
function parsePromoNumber(raw: unknown): number {
  if (raw === null || raw === undefined || raw === '') return NaN;
  if (typeof raw === 'number') return raw;
  const normalized = String(raw)
    .trim()
    .replace('%', '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');
  return parseFloat(normalized);
}

export function getPromoDiscountPercent(source: PromoDiscountSource | null | undefined): number {
  if (!source) return 0;
  const value = parsePromoNumber(source.promodiscountpercent ?? source.promoDiscountPercent);
  if (!Number.isFinite(value) || value <= 0) return 0;
  // Whole-percent discounts only (avoids float drift like 19.999 → odd UI).
  return Math.min(99, Math.max(1, Math.round(value)));
}

export function hasActivePromo(source: PromoDiscountSource | null | undefined): boolean {
  return getPromoDiscountPercent(source) > 0;
}

/** Round money to 2 decimals. */
export function roundMoney(amount: number): number {
  return Math.round((Number(amount) || 0) * 100) / 100;
}

export function getPromoSalePrice(originalPrice: number, source: PromoDiscountSource | null | undefined): number {
  const percent = getPromoDiscountPercent(source);
  if (percent <= 0) return roundMoney(originalPrice);
  return roundMoney(originalPrice * (1 - percent / 100));
}

export function normalizePromoDiscountPercent(input: unknown): number | null {
  const value = parsePromoNumber(input);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.min(99, Math.max(1, Math.round(value)));
}
