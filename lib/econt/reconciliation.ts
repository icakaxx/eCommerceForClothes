import { moneyToCents, centsToMoney, roundMoney } from '@/lib/econt/money';

export type FinancialSnapshot = {
  expectedCod: number | null;
  collectedCod: number | null;
  paidCod: number | null;
  collectedCurrency: string | null;
  paidCurrency: string | null;
  unknownFinancial: boolean;
  currencyMismatch: boolean;
};

export function reconcileFinancialSources(params: {
  trackingCollected: number | null;
  trackingPaid: number | null;
  reportPaid: number | null;
  currency: string;
  reportCurrency?: string | null;
}): { discrepancy: boolean; notes: string[] } {
  const notes: string[] = [];
  let discrepancy = false;
  if (
    params.trackingPaid !== null &&
    params.reportPaid !== null &&
    roundMoney(params.trackingPaid) !== roundMoney(params.reportPaid)
  ) {
    discrepancy = true;
    notes.push('tracking_paid_vs_report');
  }
  if (params.reportCurrency && params.reportCurrency !== params.currency) {
    discrepancy = true;
    notes.push('report_currency_mismatch');
  }
  return { discrepancy, notes };
}

export type SelectedFinancialTotals = {
  expectedCod: number;
  collectedCod: number;
  paidCod: number;
  collectedUnpaid: number;
  returnedCount: number;
  returnedOrderValue: number;
  merchantDeliveryCost: number;
  unknownFinancialCount: number;
  currencyMismatchCount: number;
};

export function aggregateSelectedFinancials(
  rows: Array<{
    expectedCod: number | null;
    collectedCod: number | null;
    paidCod: number | null;
    normalizedStatus: string;
    merchantDeliveryCost: number | null;
    collectedCurrency: string | null;
    paidCurrency: string | null;
    codCurrency: string;
  }>
): SelectedFinancialTotals {
  let expectedCents = 0;
  let collectedCents = 0;
  let paidCents = 0;
  let unpaidCents = 0;
  let returnedCount = 0;
  let returnedCents = 0;
  let merchantCents = 0;
  let unknownFinancialCount = 0;
  let currencyMismatchCount = 0;

  for (const row of rows) {
    if (row.expectedCod !== null) expectedCents += moneyToCents(row.expectedCod);
    if (row.collectedCod !== null) collectedCents += moneyToCents(row.collectedCod);
    if (row.paidCod !== null) paidCents += moneyToCents(row.paidCod);
    if (row.collectedCod !== null && row.paidCod !== null) {
      unpaidCents += Math.max(0, moneyToCents(row.collectedCod) - moneyToCents(row.paidCod));
    } else if (row.expectedCod !== null) {
      unknownFinancialCount += 1;
    }
    if (row.merchantDeliveryCost !== null) merchantCents += moneyToCents(row.merchantDeliveryCost);
    if (
      (row.collectedCurrency && row.collectedCurrency !== row.codCurrency) ||
      (row.paidCurrency && row.paidCurrency !== row.codCurrency)
    ) {
      currencyMismatchCount += 1;
    }
    if (row.normalizedStatus === 'returned') {
      returnedCount += 1;
      if (row.expectedCod !== null) returnedCents += moneyToCents(row.expectedCod);
    }
  }

  return {
    expectedCod: centsToMoney(expectedCents),
    collectedCod: centsToMoney(collectedCents),
    paidCod: centsToMoney(paidCents),
    collectedUnpaid: centsToMoney(unpaidCents),
    returnedCount,
    returnedOrderValue: centsToMoney(returnedCents),
    merchantDeliveryCost: centsToMoney(merchantCents),
    unknownFinancialCount,
    currencyMismatchCount,
  };
}
