import 'server-only';

import { econtPost } from '@/lib/econt/client';
import type { PaymentReportRow } from '@/lib/econt/types';

export async function fetchPaymentReport(dateFrom: string, dateTo: string): Promise<PaymentReportRow[]> {
  const { data } = await econtPost<Record<string, unknown>>(
    'PaymentReport/PaymentReportService.PaymentReport.json',
    { dateFrom, dateTo }
  );
  const rows = data.PaymentReportRows ?? data.paymentReportRows ?? data.rows;
  if (!rows) return [];
  if (!Array.isArray(rows)) return [];
  return rows as PaymentReportRow[];
}

export function isCodReportRow(row: PaymentReportRow): boolean {
  const type = (row.type ?? '').toLowerCase();
  return type.includes('cod') || type.includes('налож');
}
