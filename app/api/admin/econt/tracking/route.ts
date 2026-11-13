export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, structuredAdminErrorResponse } from '@/lib/admin-api-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { STATUS_LABELS_BG } from '@/lib/econt/status-mapper';
import { getEcontRuntimeEnv } from '@/lib/econt/config';
import { centsToMoney, moneyToCents, sumMoney } from '@/lib/econt/money';
import {
  inSofiaRange,
  isUncollectedOverDays,
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

    const sumKnown = (values: Array<number | null>) => sumMoney(values);

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
