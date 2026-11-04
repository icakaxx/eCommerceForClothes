import { describe, expect, it } from 'vitest';
import { computeProductCodFromOrder, isValidPhone } from '@/lib/econt/validation';
import { aggregateSelectedFinancials } from '@/lib/econt/reconciliation';
import { normalizeEcontStatus } from '@/lib/econt/status-mapper';

describe('money and COD', () => {
  it('computes COD without shipping', () => {
    expect(
      computeProductCodFromOrder({
        items: [{ price: 59, quantity: 2 }],
        discountAmount: 10,
      })
    ).toBe(108);
  });
});

describe('phone validation', () => {
  it('accepts typical BG lengths', () => {
    expect(isValidPhone('0888123456')).toBe(true);
  });
});

describe('status normalization', () => {
  it('distinguishes returning vs returned', () => {
    expect(normalizeEcontStatus('Връща се към подател')).toBe('returning');
    expect(normalizeEcontStatus('Върната')).toBe('returned');
  });
});

describe('selected financial totals', () => {
  it('matches documented example pattern', () => {
    const totals = aggregateSelectedFinancials([
      { expectedCod: 69, collectedCod: 69, paidCod: 69, normalizedStatus: 'delivered', merchantDeliveryCost: 4.5, collectedCurrency: 'EUR', paidCurrency: 'EUR', codCurrency: 'EUR' },
      { expectedCod: 118, collectedCod: 118, paidCod: 0, normalizedStatus: 'delivered', merchantDeliveryCost: 4.5, collectedCurrency: 'EUR', paidCurrency: 'EUR', codCurrency: 'EUR' },
      { expectedCod: 49, collectedCod: null, paidCod: null, normalizedStatus: 'returned', merchantDeliveryCost: 4.5, collectedCurrency: null, paidCurrency: null, codCurrency: 'EUR' },
    ]);
    expect(totals.expectedCod).toBe(236);
    expect(totals.collectedCod).toBe(187);
    expect(totals.paidCod).toBe(69);
    expect(totals.collectedUnpaid).toBe(118);
    expect(totals.returnedCount).toBe(1);
    expect(totals.returnedOrderValue).toBe(49);
  });
});
