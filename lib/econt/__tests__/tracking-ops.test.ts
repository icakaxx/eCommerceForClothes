import { describe, expect, it } from 'vitest';
import { normalizeEcontStatus } from '@/lib/econt/status-mapper';
import { aggregateSelectedFinancials } from '@/lib/econt/reconciliation';
import {
  csvCell,
  isPaymentReportDue,
  isSyncDue,
  officeWaitDays,
  officeWaitPriority,
  selectDueShipmentIds,
} from '@/lib/econt/sync-policy';
import { diffAwbNumbers, isUncollectedOverDays, resolveRange } from '@/lib/econt/tracking-dashboard';

describe('official status phrases', () => {
  it('maps prepared, office, delivered, returned and cancelled without guessing delivered', () => {
    expect(normalizeEcontStatus('Подготвена в eEcont')).toBe('prepared');
    expect(normalizeEcontStatus('Приета в Еконт')).toBe('accepted');
    expect(normalizeEcontStatus('Пътува по линия')).toBe('in_transit');
    expect(normalizeEcontStatus('В офис')).toBe('in_office');
    expect(normalizeEcontStatus('Доставена')).toBe('delivered');
    expect(normalizeEcontStatus('Връща се към подател')).toBe('returning');
    expect(normalizeEcontStatus('Върната и доставена към подател')).toBe('returned');
    expect(normalizeEcontStatus('Анулирана преди изпращане')).toBe('cancelled');
    expect(normalizeEcontStatus('някакво ново състояние')).toBe('unknown');
  });
});

describe('sync due selection', () => {
  const now = new Date('2026-11-13T10:00:00.000Z');

  it('refreshes active shipments after 5 minutes and keeps complete delivered shipments on a 6 hour cadence', () => {
    const active = {
      id: 'a',
      normalizedStatus: 'in_transit',
      lastSuccessfulSyncAt: '2026-11-13T09:54:00.000Z',
      collectedCod: null,
      paidCod: null,
    };
    const fresh = {
      ...active,
      id: 'b',
      lastSuccessfulSyncAt: '2026-11-13T09:58:00.000Z',
    };
    const delivered = {
      id: 'c',
      normalizedStatus: 'delivered',
      lastSuccessfulSyncAt: '2026-11-13T08:00:00.000Z',
      collectedCod: 10,
      paidCod: 10,
    };
    expect(isSyncDue(active, now)).toBe(true);
    expect(isSyncDue(fresh, now)).toBe(false);
    expect(isSyncDue(delivered, now)).toBe(false);
    expect(selectDueShipmentIds([fresh, active, delivered], now)).toEqual(['a']);
  });

  it('pulls the payout report again only after 30 minutes', () => {
    expect(isPaymentReportDue(null, now)).toBe(true);
    expect(isPaymentReportDue('2026-11-13T09:40:00.000Z', now)).toBe(false);
    expect(isPaymentReportDue('2026-11-13T09:29:00.000Z', now)).toBe(true);
  });
});

describe('office wait', () => {
  it('does not invent wait time without an arrival timestamp', () => {
    expect(officeWaitDays(null, new Date())).toBeNull();
    expect(officeWaitPriority(null)).toBe('unknown');
    expect(officeWaitPriority(officeWaitDays('2026-11-09T10:00:00.000Z', new Date('2026-11-13T10:00:00.000Z')))).toBe('high');
  });
});

describe('explicit zero is not missing money', () => {
  it('counts unpaid only when both collection and payout are known', () => {
    const totals = aggregateSelectedFinancials([
      { expectedCod: 69, collectedCod: 69, paidCod: 69, normalizedStatus: 'delivered', merchantDeliveryCost: null, collectedCurrency: 'EUR', paidCurrency: 'EUR', codCurrency: 'EUR' },
      { expectedCod: 118, collectedCod: 118, paidCod: 0, normalizedStatus: 'delivered', merchantDeliveryCost: null, collectedCurrency: 'EUR', paidCurrency: 'EUR', codCurrency: 'EUR' },
      { expectedCod: 49, collectedCod: 0, paidCod: 0, normalizedStatus: 'returned', merchantDeliveryCost: null, collectedCurrency: 'EUR', paidCurrency: 'EUR', codCurrency: 'EUR' },
      { expectedCod: 20, collectedCod: null, paidCod: null, normalizedStatus: 'in_transit', merchantDeliveryCost: null, collectedCurrency: null, paidCurrency: null, codCurrency: 'EUR' },
    ]);
    expect(totals.expectedCod).toBe(256);
    expect(totals.collectedCod).toBe(187);
    expect(totals.paidCod).toBe(69);
    expect(totals.collectedUnpaid).toBe(118);
    expect(totals.unknownFinancialCount).toBe(1);
  });
});

describe('csv safety', () => {
  it('escapes quotes and formula prefixes', () => {
    expect(csvCell('=cmd')).toBe(`"'=cmd"`);
    expect(csvCell('a"b')).toBe(`"a""b"`);
  });
});

describe('dashboard filters', () => {
  it('resolves a seven day window and finds AWBs missing locally', () => {
    const range = resolveRange('7d', new Date('2026-11-13T10:00:00.000Z'));
    expect(range.to).toBe('2026-11-13');
    expect(range.from).toBeTruthy();
    expect(diffAwbNumbers(['100', '200'], ['100'])).toEqual({
      missingLocally: ['200'],
      onlyLocal: [],
    });
  });

  it('requires a real office arrival before the 3 day filter matches', () => {
    const now = new Date('2026-11-13T10:00:00.000Z');
    expect(isUncollectedOverDays({
      status: 'in_office',
      events: [],
      now,
      minDays: 3,
    }).match).toBe(false);
    expect(isUncollectedOverDays({
      status: 'in_office',
      events: [{ event_time: '2026-11-09T10:00:00.000Z', description: 'Пристигнала в офис' }],
      now,
      minDays: 3,
    }).match).toBe(true);
    expect(isUncollectedOverDays({
      status: 'delivered',
      events: [{ event_time: '2026-11-01T10:00:00.000Z', description: 'В офис' }],
      now,
      minDays: 3,
    }).match).toBe(false);
  });
});
