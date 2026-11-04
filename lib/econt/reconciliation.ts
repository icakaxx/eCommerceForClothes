import { roundMoney } from '@/lib/econt/money';

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
  let expectedCod = 0;
  let collectedCod = 0;
  let paidCod = 0;
  let returnedCount = 0;
  let returnedOrderValue = 0;
  let merchantDeliveryCost = 0;
  let unknownFinancialCount = 0;
  let currencyMismatchCount = 0;

  for (const row of rows) {
    if (row.expectedCod !== null) expectedCod += row.expectedCod;
    if (row.collectedCod !== null) collectedCod += row.collectedCod;
    else if (row.normalizedStatus === 'delivered') unknownFinancialCount += 1;
    if (row.paidCod !== null) paidCod += row.paidCod;
    if (row.merchantDeliveryCost !== null) merchantDeliveryCost += row.merchantDeliveryCost;
    if (
      (row.collectedCurrency && row.collectedCurrency !== row.codCurrency) ||
      (row.paidCurrency && row.paidCurrency !== row.codCurrency)
    ) {
      currencyMismatchCount += 1;
    }
    if (row.normalizedStatus === 'returned') {
      returnedCount += 1;
      if (row.expectedCod !== null) returnedOrderValue += row.expectedCod;
    }
    if (row.collectedCod === null && row.paidCod === null && row.expectedCod !== null) {
      unknownFinancialCount += 1;
    }
  }

  const collectedUnpaid = Math.max(0, roundMoney(collectedCod - paidCod));

  return {
    expectedCod: roundMoney(expectedCod),
    collectedCod: roundMoney(collectedCod),
    paidCod: roundMoney(paidCod),
    collectedUnpaid,
    returnedCount,
    returnedOrderValue: roundMoney(returnedOrderValue),
    merchantDeliveryCost: roundMoney(merchantDeliveryCost),
    unknownFinancialCount,
    currencyMismatchCount,
  };
}
