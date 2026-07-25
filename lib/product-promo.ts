/** Percentage off original price (1–99). Null/0 = no active promo. */
export type PromoDiscountSource = {
  promodiscountpercent?: number | null;
  promoDiscountPercent?: number | null;
};

export function getPromoDiscountPercent(source: PromoDiscountSource | null | undefined): number {
  if (!source) return 0;
  const raw = source.promodiscountpercent ?? source.promoDiscountPercent;
  const value = typeof raw === 'string' ? parseFloat(raw) : Number(raw);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(99, Math.round(value * 100) / 100);
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
  if (input === null || input === undefined || input === '') return null;
  const value = typeof input === 'string' ? parseFloat(input) : Number(input);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.min(99, Math.round(value * 100) / 100);
}
