import 'server-only';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { syncShipmentsByIds } from '@/lib/econt/shipment-service';
import { fetchPaymentReport, isCodReportRow } from '@/lib/econt/payments';
import { SYNC_INTERVALS_MS, isPaymentReportDue, selectDueShipmentIds, type SyncCandidate } from '@/lib/econt/sync-policy';
import { sofiaDateKey } from '@/lib/econt/tracking-dashboard';
import { getEcontRuntimeEnv } from '@/lib/econt/config';

export type SyncRunResult = {
  alreadyRunning: boolean;
  processed: number;
  success: number;
  failure: number;
  unchanged: number;
  message: string;
};

async function expireStaleLocks(now: Date) {
  const cutoff = new Date(now.getTime() - SYNC_INTERVALS_MS.lockLease).toISOString();
  await supabaseAdmin
    .from('econt_sync_runs')
    .update({
      status: 'expired',
      completed_at: now.toISOString(),
      error_summary: 'Lock lease expired',
    })
    .eq('sync_type', 'tracking')
    .eq('status', 'running')
    .lt('started_at', cutoff);
}

async function acquireLock(now: Date): Promise<{ id: string } | null> {
  await expireStaleLocks(now);
  const { data: running } = await supabaseAdmin
    .from('econt_sync_runs')
    .select('id')
    .eq('sync_type', 'tracking')
    .eq('status', 'running')
    .limit(1);
  if (running && running.length > 0) return null;

  const { data, error } = await supabaseAdmin
    .from('econt_sync_runs')
    .insert({
      sync_type: 'tracking',
      environment: getEcontRuntimeEnv(),
      status: 'running',
    })
    .select('id')
    .single();
  if (error || !data) return null;
  return { id: data.id };
}

export async function runTrackingSync(params: {
  shipmentIds?: string[] | null;
  onlyDue?: boolean;
  limit?: number;
}): Promise<SyncRunResult> {
  const now = new Date();
  const lock = await acquireLock(now);
  if (!lock) {
    return {
      alreadyRunning: true,
      processed: 0,
      success: 0,
      failure: 0,
      unchanged: 0,
      message: 'Синхронизацията вече се изпълнява. Данните ще се обновят след приключването ѝ.',
    };
  }

  try {
    let ids = params.shipmentIds?.filter(Boolean) ?? [];
    if (params.onlyDue || ids.length === 0) {
      const { data } = await supabaseAdmin
        .from('econt_shipments')
        .select('id, normalized_delivery_status, last_sync_at, collected_cod_amount, paid_cod_amount, shipment_number')
        .not('shipment_number', 'is', null)
        .limit(500);
      const candidates: SyncCandidate[] = (data ?? [])
        .filter((row) => !ids.length || ids.includes(row.id))
        .map((row) => ({
          id: row.id,
          normalizedStatus: row.normalized_delivery_status,
          lastSuccessfulSyncAt: row.last_sync_at,
          collectedCod: row.collected_cod_amount === null || row.collected_cod_amount === undefined ? null : Number(row.collected_cod_amount),
          paidCod: row.paid_cod_amount === null || row.paid_cod_amount === undefined ? null : Number(row.paid_cod_amount),
        }));
      ids = params.onlyDue
        ? selectDueShipmentIds(candidates, now, params.limit ?? 40)
        : candidates.map((row) => row.id).slice(0, params.limit ?? 40);
    }

    if (ids.length === 0) {
      await supabaseAdmin
        .from('econt_sync_runs')
        .update({ status: 'completed', completed_at: new Date().toISOString(), processed_count: 0 })
        .eq('id', lock.id);
      return {
        alreadyRunning: false,
        processed: 0,
        success: 0,
        failure: 0,
        unchanged: 0,
        message: 'Няма пратки за обновяване в този момент.',
      };
    }

    const result = await syncShipmentsByIds(ids);
    const unchanged = Math.max(0, result.success);
    await supabaseAdmin
      .from('econt_sync_runs')
      .update({
        status: result.failure > 0 && result.success === 0 ? 'failed' : 'completed',
        completed_at: new Date().toISOString(),
        processed_count: result.processed,
        success_count: result.success,
        failure_count: result.failure,
      })
      .eq('id', lock.id);

    return {
      alreadyRunning: false,
      processed: result.processed,
      success: result.success,
      failure: result.failure,
      unchanged,
      message: `Проверени ${result.processed} пратки. Успешни ${result.success}, грешка при ${result.failure}.`,
    };
  } catch (error) {
    await supabaseAdmin
      .from('econt_sync_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_summary: 'sync_failed',
      })
      .eq('id', lock.id);
    throw error;
  }
}

export type PaymentSyncResult = {
  skipped: boolean;
  failed: boolean;
  imported: number;
  totalRows: number;
};

/** Pulls the COD payout report when the last attempt is older than 30 minutes. Read-only toward Econt. */
export async function runDuePaymentSync(now = new Date()): Promise<PaymentSyncResult> {
  const idle: PaymentSyncResult = { skipped: true, failed: false, imported: 0, totalRows: 0 };
  const { data: recent } = await supabaseAdmin
    .from('econt_sync_runs')
    .select('started_at, status')
    .eq('sync_type', 'payment_report')
    .order('started_at', { ascending: false })
    .limit(1);
  const last = recent?.[0];
  if (last?.status === 'running') {
    const started = new Date(last.started_at).getTime();
    if (!Number.isNaN(started) && now.getTime() - started < SYNC_INTERVALS_MS.lockLease) return idle;
  }
  if (last && last.status !== 'failed' && !isPaymentReportDue(last.started_at, now)) return idle;

  const { data: lock, error: lockError } = await supabaseAdmin
    .from('econt_sync_runs')
    .insert({
      sync_type: 'payment_report',
      environment: getEcontRuntimeEnv(),
      status: 'running',
    })
    .select('id')
    .single();
  if (lockError || !lock) return { ...idle, failed: true };

  const dateTo = sofiaDateKey(now);
  const dateFrom = sofiaDateKey(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000));
  try {
    const rows = (await fetchPaymentReport(dateFrom, dateTo)).filter(isCodReportRow);
    let imported = 0;
    for (const row of rows) {
      const shipmentNumber = String(row.num ?? '');
      if (!shipmentNumber) continue;
      const { data: shipment } = await supabaseAdmin
        .from('econt_shipments')
        .select('id')
        .eq('shipment_number', shipmentNumber)
        .maybeSingle();
      const paidAt = row.payDate ? new Date(row.payDate).toISOString() : null;
      const { error } = await supabaseAdmin.from('econt_payment_reports').upsert(
        {
          shipment_id: shipment?.id ?? null,
          shipment_number: shipmentNumber,
          payment_type: row.type ?? null,
          payout_method: row.payType ?? null,
          paid_amount: row.amount ?? 0,
          currency: row.currency ?? 'EUR',
          paid_at: paidAt,
          source_document_created_at: row.createdTime ? new Date(row.createdTime).toISOString() : null,
          raw_report_data: row,
        },
        { onConflict: 'shipment_number,source_type,payment_type,paid_amount,currency,paid_at', ignoreDuplicates: true }
      );
      if (!error) imported += 1;
    }
    await supabaseAdmin
      .from('econt_sync_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        processed_count: rows.length,
        success_count: imported,
      })
      .eq('id', lock.id);
    return { skipped: false, failed: false, imported, totalRows: rows.length };
  } catch {
    await supabaseAdmin
      .from('econt_sync_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_summary: 'payment_report_failed',
      })
      .eq('id', lock.id);
    return { skipped: false, failed: true, imported: 0, totalRows: 0 };
  }
}
