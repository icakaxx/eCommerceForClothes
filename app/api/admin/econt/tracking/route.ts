export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, structuredAdminErrorResponse } from '@/lib/admin-api-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { fetchAccountAwbs, type AccountAwb } from '@/lib/econt/account-awb';
import { normalizeEcontStatus, STATUS_LABELS_BG } from '@/lib/econt/status-mapper';
import { getEcontRuntimeEnv } from '@/lib/econt/config';
import { centsToMoney, moneyToCents, sumMoney } from '@/lib/econt/money';
import {
  accountWindow,
  inSofiaRange,
  isUncollectedOverDays,
  isUnfinishedAwb,
  resolveRange,
  weekKey,
  type RangePreset,
} from '@/lib/econt/tracking-dashboard';

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const sp = request.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get('page') ?? 1));
    const pageSize = Math.min(50, Math.max(5, Number(sp.get('pageSize') ?? 20)));
    const status = sp.get('status');
    const q = sp.get('q')?.trim().toLowerCase() ?? '';
    const preset = (sp.get('preset') || 'all') as RangePreset;
    const range = resolveRange(preset, new Date(), sp.get('dateFrom'), sp.get('dateTo'));
    const operational = sp.get('operational') || '';
    const idsOnly = sp.get('idsOnly') === '1';

    const { data: universe, error } = await supabaseAdmin
      .from('econt_shipments')
      .select(
        'id, order_id, shipment_number, created_at, normalized_delivery_status, collected_cod_amount, collected_cod_at, paid_cod_amount, paid_cod_at, expected_cod_amount, last_sync_at, last_sync_error, sender_due_amount, econt_tracking_events(event_time, description, event_type), orders(customers(firstname, lastname, telephone, city))'
      )
      .not('shipment_number', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      return structuredAdminErrorResponse({
        code: 'DB_ERROR',
        title: 'Грешка при зареждане',
        message: 'Не успяхме да заредим пратките.',
        retryable: true,
        status: 500,
      });
    }

    const now = new Date();
    let accountRows: AccountAwb[] = [];
    let accountError: string | null = null;
    try {
      accountRows = await fetchAccountAwbs();
    } catch {
      accountError = 'Еконт не върна списъка с пратки за акаунта. Показани са само записаните при нас.';
    }

    const sumKnown = (values: Array<number | null>) => sumMoney(values);
    const sumKnownOrNull = (values: Array<number | null>) => (
      values.some((value) => value !== null && value !== undefined) ? sumMoney(values) : null
    );

    if (accountRows.length > 0) {
      const localByNumber = new Map((universe ?? []).filter((row) => row.shipment_number).map((row) => [String(row.shipment_number), row]));
      const window = accountWindow(preset, now, sp.get('dateFrom'), sp.get('dateTo'));
      const dated = preset === 'h24' || preset === 'd7' || preset === 'm1' || preset === 'm2' || preset === 'm3' || preset === 'm4' || preset === 'm5' || preset === 'custom' || preset === '7d';
      const view = accountRows.filter((row) => {
        if (preset === 'open' && !isUnfinishedAwb(row.kind)) return false;
        if (preset === 'instructions' && row.kind !== 'instruction') return false;
        if (dated) {
          if (row.createdMs === null) return false;
          if (window.fromMs !== null && row.createdMs < window.fromMs) return false;
          if (window.toMs !== null && row.createdMs >= window.toMs) return false;
        }
        const normalized = row.kind === 'prepared'
          ? 'prepared'
          : row.kind === 'delivered'
            ? 'delivered'
            : row.kind === 'returned'
              ? 'returned'
              : row.kind === 'cancelled'
                ? 'cancelled'
                : row.kind === 'instruction'
                  ? 'unknown'
                  : (normalizeEcontStatus(row.plainStatus) === 'unknown' ? 'in_transit' : normalizeEcontStatus(row.plainStatus));
        if (status && status !== 'all' && normalized !== status) return false;
        const local = localByNumber.get(row.shipmentNumber);
        if (operational === 'uncollected3') {
          const wait = isUncollectedOverDays({
            status: local?.normalized_delivery_status ?? normalized,
            events: local?.econt_tracking_events ?? [],
            now,
            minDays: 3,
          });
          if (!wait.match) return false;
        }
        if (q) {
          const customer = (local?.orders as { customers?: { firstname?: string; lastname?: string; telephone?: string; city?: string } } | null)?.customers;
          const haystack = [row.shipmentNumber, local?.order_id, row.plainStatus, customer?.firstname, customer?.lastname, customer?.telephone, customer?.city]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      }).map((row) => {
        const local = localByNumber.get(row.shipmentNumber);
        const normalized = row.kind === 'prepared'
          ? 'prepared'
          : row.kind === 'delivered'
            ? 'delivered'
            : row.kind === 'returned'
              ? 'returned'
              : row.kind === 'cancelled'
                ? 'cancelled'
                : row.kind === 'instruction'
                  ? 'unknown'
                  : (normalizeEcontStatus(row.plainStatus) === 'unknown' ? 'in_transit' : normalizeEcontStatus(row.plainStatus));
        return { row, local, normalized };
      });

      const receivedCod = accountRows
        .filter((row) => row.kind === 'delivered' && row.cdAmount !== null && row.cdAmount !== 0)
        .map((row) => row.cdAmount as number);
      const summary = {
        all: view.length,
        sent: view.filter((item) => item.row.side === 'sender').length,
        forMe: view.filter((item) => item.row.side === 'receiver').length,
        instructions: accountRows.filter((row) => row.kind === 'instruction').length,
        prepared: view.filter((item) => item.normalized === 'prepared' || item.normalized === 'accepted').length,
        inTransit: view.filter((item) => item.normalized === 'in_transit' || item.normalized === 'out_for_delivery').length,
        inOffice: view.filter((item) => item.normalized === 'in_office').length,
        delivered: view.filter((item) => item.normalized === 'delivered').length,
        returning: view.filter((item) => item.normalized === 'returning').length,
        returned: view.filter((item) => item.normalized === 'returned').length,
        syncErrors: view.filter((item) => Boolean(item.local?.last_sync_error)).length,
        uncollectedOver3: view.filter((item) => isUncollectedOverDays({
          status: item.normalized,
          events: item.local?.econt_tracking_events ?? [],
          now,
          minDays: 3,
        }).match).length,
        expectedCod: sumKnown(view.map((item) => item.row.cdAmount)),
        collectedCod: sumKnownOrNull(view.map((item) => (item.local?.collected_cod_amount == null ? null : Number(item.local.collected_cod_amount)))),
        paidCod: sumKnownOrNull(view.map((item) => (item.local?.paid_cod_amount == null ? null : Number(item.local.paid_cod_amount)))),
        receivedCod,
        unknownFinancial: view.filter((item) => item.row.cdAmount === null).length,
        lastSyncAt: null as string | null,
        range,
        accountError,
        dateBasis: {
          logistics: preset === 'open'
            ? 'Неприключени са пратките, които още не са получени и не са върнати.'
            : 'Периодът е по датата на създаване в Еконт.',
          codCollected: 'Полученият НП е сумата по доставена товарителница от Еконт.',
          codPaid: 'Редовете в справката за изплащания са отделно от сумата по товарителницата.',
        },
      };

      const charts = {
        payoutsByDay: [] as Array<{ date: string; amount: number }>,
        deliveredVsReturnedByWeek: [] as Array<{ week: string; delivered: number; returned: number }>,
        byStatus: [
          { status: 'prepared', count: summary.prepared },
          { status: 'in_transit', count: summary.inTransit },
          { status: 'in_office', count: summary.inOffice },
          { status: 'delivered', count: summary.delivered },
          { status: 'returning', count: summary.returning },
          { status: 'returned', count: summary.returned },
        ],
      };

      if (idsOnly) {
        return NextResponse.json({
          success: true,
          ids: view.map((item) => item.local?.id ?? `awb:${item.row.shipmentNumber}`),
          total: view.length,
          summary,
          charts,
        });
      }

      const start = (page - 1) * pageSize;
      const pageItems = view.slice(start, start + pageSize);
      const storedIds = pageItems.map((item) => item.local?.id).filter(Boolean) as string[];
      const fullById = new Map<string, Record<string, unknown>>();
      if (storedIds.length) {
        const { data: pageRows } = await supabaseAdmin
          .from('econt_shipments')
          .select('*, econt_tracking_events(event_time, description, city, office, event_type), orders(orderid, createdat, deliverycost, customers(firstname, lastname, telephone, email, city))')
          .in('id', storedIds);
        for (const pageRow of pageRows ?? []) fullById.set(pageRow.id, pageRow);
      }
      const shipments = pageItems.map((item) => {
        const local = item.local?.id ? fullById.get(item.local.id) : null;
        return {
          ...(local ?? {}),
          id: item.local?.id ?? `awb:${item.row.shipmentNumber}`,
          storedId: item.local?.id ?? null,
          side: item.row.side,
          shipment_number: item.row.shipmentNumber,
          order_id: (local as { order_id?: string } | null)?.order_id ?? item.local?.order_id ?? null,
          raw_delivery_status: item.row.plainStatus,
          normalized_delivery_status: item.normalized,
          expected_cod_amount: item.row.cdAmount,
          created_at: item.row.createdAt ?? (local as { created_at?: string } | null)?.created_at ?? null,
          orders: (local as { orders?: unknown } | null)?.orders ?? item.local?.orders ?? null,
          econt_tracking_events: (local as { econt_tracking_events?: unknown } | null)?.econt_tracking_events ?? item.local?.econt_tracking_events ?? [],
        };
      });

      return NextResponse.json({
        success: true,
        environment: getEcontRuntimeEnv(),
        statusLabels: STATUS_LABELS_BG,
        summary,
        charts,
        page,
        pageSize,
        total: view.length,
        shipments,
        refreshedAt: new Date().toISOString(),
      });
    }

    const filtered = (universe ?? []).filter((row) => {
      if (status && status !== 'all' && row.normalized_delivery_status !== status) return false;
      if (!inSofiaRange(row.created_at, range.from, range.to)) return false;
      if (operational === 'uncollected3') {
        const wait = isUncollectedOverDays({
          status: row.normalized_delivery_status,
          events: row.econt_tracking_events ?? [],
          now,
          minDays: 3,
        });
        if (!wait.match) return false;
      }
      if (q) {
        const customer = (row.orders as { customers?: { firstname?: string; lastname?: string; telephone?: string; city?: string } } | null)?.customers;
        const haystack = [row.shipment_number, row.order_id, customer?.firstname, customer?.lastname, customer?.telephone, customer?.city]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const createdInRange = filtered;
    const collectedInRange = createdInRange.filter((row) => inSofiaRange(row.collected_cod_at, range.from, range.to) && row.collected_cod_amount !== null);
    const paidInRange = (universe ?? []).filter((row) => inSofiaRange(row.paid_cod_at, range.from, range.to) && row.paid_cod_amount !== null);
    const uncollected = (universe ?? []).filter((row) =>
      isUncollectedOverDays({
        status: row.normalized_delivery_status,
        events: row.econt_tracking_events ?? [],
        now,
        minDays: 3,
      }).match
    ).length;

    const payoutsByDay = new Map<string, number>();
    for (const row of paidInRange) {
      const key = row.paid_cod_at ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Sofia' }).format(new Date(row.paid_cod_at)) : '';
      if (!key) continue;
      payoutsByDay.set(key, (payoutsByDay.get(key) ?? 0) + moneyToCents(Number(row.paid_cod_amount)));
    }
    const byWeek = new Map<string, { delivered: number; returned: number }>();
    for (const row of createdInRange) {
      if (!row.created_at) continue;
      const key = weekKey(row.created_at);
      const bucket = byWeek.get(key) ?? { delivered: 0, returned: 0 };
      if (row.normalized_delivery_status === 'delivered') bucket.delivered += 1;
      if (row.normalized_delivery_status === 'returned') bucket.returned += 1;
      byWeek.set(key, bucket);
    }

    const summary = {
      all: createdInRange.length,
      prepared: createdInRange.filter((s) => s.normalized_delivery_status === 'prepared' || s.normalized_delivery_status === 'accepted').length,
      inTransit: createdInRange.filter((s) => s.normalized_delivery_status === 'in_transit' || s.normalized_delivery_status === 'out_for_delivery').length,
      inOffice: createdInRange.filter((s) => s.normalized_delivery_status === 'in_office').length,
      delivered: createdInRange.filter((s) => s.normalized_delivery_status === 'delivered').length,
      returning: createdInRange.filter((s) => s.normalized_delivery_status === 'returning').length,
      returned: createdInRange.filter((s) => s.normalized_delivery_status === 'returned').length,
      syncErrors: createdInRange.filter((s) => Boolean(s.last_sync_error)).length,
      uncollectedOver3: uncollected,
      expectedCod: sumKnown(createdInRange.map((s) => (s.expected_cod_amount === null ? null : Number(s.expected_cod_amount)))),
      collectedCod: sumKnown(collectedInRange.map((s) => Number(s.collected_cod_amount))),
      paidCod: sumKnown(paidInRange.map((s) => Number(s.paid_cod_amount))),
      unknownFinancial: createdInRange.filter((s) => s.collected_cod_amount === null || s.paid_cod_amount === null).length,
      lastSyncAt: createdInRange.reduce<string | null>((max, s) => {
        if (!s.last_sync_at) return max;
        if (!max || s.last_sync_at > max) return s.last_sync_at;
        return max;
      }, null),
      range,
      dateBasis: {
        logistics: 'Бройките и заявеният НП са по дата на създаване на товарителницата.',
        codCollected: 'Събраният НП е по collected_cod_at. Без дата не влиза в периода.',
        codPaid: 'Изплатеният НП е по paid_cod_at, не по датата на създаване.',
      },
    };

    const charts = {
      payoutsByDay: [...payoutsByDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, cents]) => ({ date, amount: centsToMoney(cents) })),
      deliveredVsReturnedByWeek: [...byWeek.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([week, counts]) => ({ week, ...counts })),
      byStatus: [
        { status: 'prepared', count: summary.prepared },
        { status: 'in_transit', count: summary.inTransit },
        { status: 'in_office', count: summary.inOffice },
        { status: 'delivered', count: summary.delivered },
        { status: 'returning', count: summary.returning },
        { status: 'returned', count: summary.returned },
      ],
    };

    if (idsOnly) {
      return NextResponse.json({
        success: true,
        ids: filtered.map((row) => row.id),
        total: filtered.length,
        summary,
        charts,
      });
    }

    const start = (page - 1) * pageSize;
    const pageIds = filtered.slice(start, start + pageSize).map((row) => row.id);
    let shipments: unknown[] = [];
    if (pageIds.length) {
      const { data: pageRows } = await supabaseAdmin
        .from('econt_shipments')
        .select('*, econt_tracking_events(event_time, description, city, office, event_type), orders(orderid, createdat, deliverycost, customers(firstname, lastname, telephone, email, city))')
        .in('id', pageIds);
      const order = new Map(pageIds.map((id, index) => [id, index]));
      shipments = (pageRows ?? []).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    }

    return NextResponse.json({
      success: true,
      environment: getEcontRuntimeEnv(),
      statusLabels: STATUS_LABELS_BG,
      summary,
      charts,
      page,
      pageSize,
      total: filtered.length,
      shipments,
      refreshedAt: new Date().toISOString(),
    });
  });
}
