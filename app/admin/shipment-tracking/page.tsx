'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import EcontDemoBanner from '../components/econt/EcontDemoBanner';
import { AdminPage, PageHeader } from '../components/layout';
import { getAdminSession } from '@/lib/auth';
import { adminAuthHeaders } from '@/lib/admin-auth-headers';
import { formatEur } from '@/lib/econt/money';
import { STATUS_LABELS_BG } from '@/lib/econt/status-mapper';

type Tab = 'shipments' | 'payouts' | 'reports';

function clock(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('bg-BG');
}

function BarList({ title, rows, money = false }: { title: string; rows: Array<{ label: string; value: number }>; money?: boolean }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <div>
      <div className="mb-2 font-medium">{title}</div>
      {rows.length === 0 ? <p className="text-gray-500">Няма данни за избрания период.</p> : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.label}>
              <div className="mb-1 flex justify-between gap-3 text-xs">
                <span>{row.label}</span>
                <span>{money ? formatEur(row.value) : row.value}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div className="h-2 rounded-full bg-black" style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ShipmentTrackingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [shipments, setShipments] = useState<any[]>([]);
  const [summary, setSummary] = useState<Record<string, any>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [totals, setTotals] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [preset, setPreset] = useState('open');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [operational, setOperational] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [charts, setCharts] = useState<any>(null);
  const [missingMessage, setMissingMessage] = useState('');
  const [tab, setTab] = useState<Tab>('shipments');
  const [syncMessage, setSyncMessage] = useState('');
  const [uiUpdatedAt, setUiUpdatedAt] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [paymentRows, setPaymentRows] = useState<any[]>([]);
  const [paymentMessage, setPaymentMessage] = useState('');
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '20',
        status: statusFilter,
        preset,
        operational,
      });
      if (preset === 'custom') {
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
      }
      const res = await fetch(`/api/admin/econt/tracking?${params}`, { headers: await adminAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setShipments(data.shipments ?? []);
        setSummary(data.summary ?? {});
        setCharts(data.charts ?? null);
        setTotal(Number(data.total ?? 0));
        setUiUpdatedAt(data.refreshedAt ?? new Date().toISOString());
      }
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [statusFilter, preset, dateFrom, dateTo, operational, page]);

  useEffect(() => {
    getAdminSession().then((session) => {
      if (!session) router.push('/admin/login');
      else void load();
    });
  }, [router, load]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      void load();
    };
    const id = window.setInterval(tick, 30_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  const selectedIds = Object.entries(selected).filter(([, on]) => on).map(([id]) => id);

  const refreshEcont = async (shipmentIds?: string[]) => {
    setSyncing(true);
    setSyncMessage('Проверяваме пратките в Еконт...');
    try {
      const res = await fetch('/api/admin/econt/shipments/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await adminAuthHeaders()) },
        body: JSON.stringify(shipmentIds?.length ? { shipmentIds } : {}),
      });
      const data = await res.json();
      setSyncMessage(data.message || data.error?.message || 'Синхронизацията приключи.');
      await load();
    } finally {
      setSyncing(false);
    }
  };

  const calcTotals = async () => {
    if (!selectedIds.length) {
      setTotals(null);
      return;
    }
    const res = await fetch('/api/admin/econt/reports/selected', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await adminAuthHeaders()) },
      body: JSON.stringify({ shipmentIds: selectedIds }),
    });
    const data = await res.json();
    if (data.success) setTotals(data.totals);
  };

  useEffect(() => {
    void calcTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds.join(',')]);

  const exportCsv = async () => {
    const res = await fetch('/api/admin/econt/reports/selected', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await adminAuthHeaders()) },
      body: JSON.stringify({ shipmentIds: selectedIds, exportCsv: true }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'econt-selected.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveAction = async (shipmentId: string, actionType: string) => {
    await fetch(`/api/admin/econt/shipments/${shipmentId}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await adminAuthHeaders()) },
      body: JSON.stringify({ actionType, note: noteDraft[shipmentId] || null }),
    });
    setSyncMessage('Вътрешното действие е записано.');
  };

  const selectAllFiltered = async () => {
    const params = new URLSearchParams({ idsOnly: '1', status: statusFilter, preset, operational, pageSize: '20' });
    if (preset === 'custom') {
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
    }
    const res = await fetch(`/api/admin/econt/tracking?${params}`, { headers: await adminAuthHeaders() });
    const data = await res.json();
    if (data.success) {
      setSelected(Object.fromEntries((data.ids ?? []).map((id: string) => [id, true])));
    }
  };

  const checkMissing = async () => {
    const from = dateFrom || new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const to = dateTo || new Date().toISOString().slice(0, 10);
    const res = await fetch(`/api/admin/econt/awb/missing?dateFrom=${from}&dateTo=${to}`, {
      headers: await adminAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      setMissingMessage(data.error?.message || 'Еконт не върна списък с товарителници.');
      return;
    }
    setMissingMessage(
      `В Еконт: ${data.remoteCount}. Липсват при нас: ${data.missingLocally?.length ?? 0}. При нас, извън отговора: ${data.onlyLocal?.length ?? 0}. Нищо не е импортирано.`
    );
  };
  const loadPayments = async () => {
    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - 30);
    const from = preset === 'custom' && dateFrom ? dateFrom : fromDate.toISOString().slice(0, 10);
    const to = preset === 'custom' && dateTo ? dateTo : today.toISOString().slice(0, 10);
    const res = await fetch('/api/admin/econt/payments/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await adminAuthHeaders()) },
      body: JSON.stringify({ dateFrom: from, dateTo: to }),
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      setPaymentMessage(data.error?.message || 'Не успяхме да получим справката за изплащанията. Статусите на пратките остават налични.');
      return;
    }
    setPaymentRows(data.rows ?? []);
    setPaymentMessage(data.message || `Редове от Еконт: ${data.totalRows ?? data.rows?.length ?? 0}. Импортирани: ${data.imported ?? 0}.`);
  };

  const cards: Array<[string, string]> = [
    ['Доставени изпратени', String(summary.sent ?? 0)],
    ['Активни изпратени', String(summary.sentActive ?? 0)],
    ['За мен', String(summary.forMe ?? 0)],
    ['Разпореждания', String(summary.instructions ?? 0)],
    ['Доставени с НП (бр.)', String(summary.receivedCount ?? 0)],
    ['Подготвени', String(summary.prepared ?? 0)],
    ['В движение / офис', String(summary.inTransit ?? 0)],
    ['Доставени (общо)', String(summary.delivered ?? 0)],
    ['Връщат се', String(summary.returning ?? 0)],
    ['Върнати', String(summary.returned ?? 0)],
    ['Непотърсени над 3 дни', String(summary.uncollectedOver3 ?? 0)],
    ['В изгледа', String(summary.all ?? 0)],
    ['Заявен НП (изглед)', formatEur(summary.expectedCod)],
    ['Събран НП (изглед)', formatEur(summary.collectedCod)],
    ['Изплатен НП (изглед)', formatEur(summary.paidCod)],
    ['Непълни фин. данни', String(summary.unknownFinancial ?? 0)],
  ];

  return (
    <AdminLayout currentPath="/admin/shipment-tracking">
      <AdminPage>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <PageHeader title="Проследи пратки" />
          <button
            type="button"
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
            onClick={() => refreshEcont(selectedIds.length ? selectedIds : undefined)}
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {selectedIds.length ? 'Обнови избраните' : 'Обнови сега'}
          </button>
        </div>
        <EcontDemoBanner />
        <p className="mb-2 text-xs text-gray-500">
          Последно обновяване от базата: {clock(uiUpdatedAt)}. Последен tracking sync: {clock(summary.lastSyncAt)}.
          Обновяването на екрана не вика Еконт. „Обнови сега“ вика Еконт.
        </p>
        {syncMessage ? <p className="mb-3 text-sm">{syncMessage}</p> : null}

        <div className="mb-4 flex gap-2">
          {([
            ['shipments', 'Пратки'],
            ['payouts', 'Изплащания'],
            ['reports', 'Справки'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`rounded-full px-4 py-1.5 text-sm ${tab === key ? 'bg-black text-white' : 'border'}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
          {cards.map(([label, value]) => (
            <div key={label} className="rounded-xl border p-3 text-sm">
              <div className="text-gray-500">{label}</div>
              <div className="text-lg font-semibold">{value}</div>
            </div>
          ))}
        </div>

        {tab === 'payouts' && (
          <div className="mb-4 rounded-xl border p-4 text-sm">
            <p className="mb-2">Справката е за последните 30 дни. Нула и липса на данни не са едно и също.</p>
            <button type="button" className="rounded-lg border px-3 py-2" onClick={loadPayments}>Обнови изплащанията</button>
            {paymentMessage ? <p className="mt-2">{paymentMessage}</p> : null}
            <ul className="mt-3 space-y-1">
              {paymentRows.map((row, index) => (
                <li key={`${row.num}-${index}`}>{row.num} · {row.payType || row.type || '—'} · {formatEur(Number(row.amount))}</li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'reports' && (
          <div className="mb-4 space-y-4 rounded-xl border p-4 text-sm">
            <p>Доставени: {summary.delivered ?? 0}. Върнати: {summary.returned ?? 0}. Заявен НП: {formatEur(summary.expectedCod)}. Събран: {formatEur(summary.collectedCod)}. Изплатен: {formatEur(summary.paidCod)}.</p>
            <p className="text-gray-500">{summary.dateBasis?.logistics} {summary.dateBasis?.codPaid}</p>
            <BarList title="Изплатен НП по ден" rows={(charts?.payoutsByDay ?? []).map((row: { date: string; amount: number }) => ({ label: row.date, value: row.amount }))} money />
            <BarList title="Статуси" rows={(charts?.byStatus ?? []).map((row: { status: string; count: number }) => ({ label: STATUS_LABELS_BG[row.status as keyof typeof STATUS_LABELS_BG] ?? row.status, value: row.count }))} />
            <BarList title="Доставени и върнати по седмица на създаване" rows={(charts?.deliveredVsReturnedByWeek ?? []).map((row: { week: string; delivered: number; returned: number }) => ({ label: `${row.week} · доставени ${row.delivered} / върнати ${row.returned}`, value: row.delivered + row.returned }))} />
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          <select className="rounded-lg border px-3 py-2 text-sm" value={preset} onChange={(e) => { setPage(1); setPreset(e.target.value); }}>
            <option value="open">Неприключени пратки</option>
            <option value="h24">Последните 24 часа</option>
            <option value="d7">Последните 7 дни</option>
            <option value="m1">Последния месец</option>
            <option value="m2">Последните 2 месеца</option>
            <option value="m3">Последните 3 месеца</option>
            <option value="m4">Последните 4 месеца</option>
            <option value="m5">Последните 5 месеца</option>
            <option value="custom">Интервал</option>
            <option value="instructions">Разпореждания</option>
          </select>
          {preset === 'custom' && (
            <>
              <input type="date" className="rounded-lg border px-3 py-2 text-sm" value={dateFrom} onChange={(e) => { setPage(1); setDateFrom(e.target.value); }} />
              <input type="date" className="rounded-lg border px-3 py-2 text-sm" value={dateTo} onChange={(e) => { setPage(1); setDateTo(e.target.value); }} />
            </>
          )}
          <select className="rounded-lg border px-3 py-2 text-sm" value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
            <option value="all">Всички</option>
            {Object.entries(STATUS_LABELS_BG).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select className="rounded-lg border px-3 py-2 text-sm" value={operational} onChange={(e) => { setPage(1); setOperational(e.target.value); }}>
            <option value="">Оперативен филтър</option>
            <option value="uncollected3">Непотърсени — над 3 дни</option>
          </select>
          <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={selectAllFiltered}>Избери всички филтрирани ({total})</button>
          <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={checkMissing}>Проверка за липсващи товарителници</button>
          <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={exportCsv} disabled={!selectedIds.length}>Експорт CSV</button>
          <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setSelected({})}>Изчисти избора</button>
        </div>
        {missingMessage ? <p className="mb-3 text-sm">{missingMessage}</p> : null}
        <p className="mb-3 text-xs text-gray-500">
          Списъкът е от акаунта в Еконт, не само от поръчките в магазина. Неприключени са пратките, които още не са получени и не са върнати. Периодите включват и приключените.
          {Array.isArray(summary.receivedCod) && summary.receivedCod.length > 0
            ? ` Доставени с наложен платеж: ${summary.receivedCod.length} пратки, общо ${formatEur(summary.receivedCod.reduce((sum: number, amount: number) => sum + amount, 0))}. Реално изплатеното към теб виж в „Изплащания“ и в колоната „изплатен“.`
            : ''}
          {summary.accountError ? ` ${summary.accountError}` : ''}
        </p>

        {loading ? <p>Зареждане...</p> : (
          <div className="space-y-2 pb-28">
            {shipments.map((shipment) => {
              const open = expanded[shipment.id];
              const customer = shipment.orders?.customers ?? {};
              const events = Array.isArray(shipment.econt_tracking_events) ? shipment.econt_tracking_events : [];
              return (
                <div key={shipment.id} className="rounded-xl border">
                  <div className="flex flex-wrap items-center gap-2 p-3 text-sm">
                    <input type="checkbox" checked={!!selected[shipment.id]} onChange={(e) => setSelected({ ...selected, [shipment.id]: e.target.checked })} />
                    <button type="button" onClick={() => setExpanded({ ...expanded, [shipment.id]: !open })}>{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                    <span className="rounded-full border px-2 py-0.5 text-xs">{shipment.side === 'receiver' ? 'За мен' : 'Изпратена'}</span>
                    {shipment.order_id ? <Link href="/admin/sales" className="underline">{shipment.order_id}</Link> : <span className="text-gray-400">без поръчка в магазина</span>}
                    <span className="font-medium">{shipment.shipment_number}</span>
                    <span>{customer.firstname} {customer.lastname}</span>
                    <span>{customer.city}</span>
                    <span>{shipment.raw_delivery_status || STATUS_LABELS_BG[shipment.normalized_delivery_status as keyof typeof STATUS_LABELS_BG] || 'Неразпознат статус от Еконт'}</span>
                    <span>НП {formatEur(shipment.expected_cod_amount)}</span>
                    <span className="text-gray-500">събран {shipment.collected_cod_amount != null ? formatEur(shipment.collected_cod_amount) : '—'}</span>
                    <span className="text-gray-500">изплатен {shipment.paid_cod_amount != null ? formatEur(shipment.paid_cod_amount) : '—'}</span>
                  </div>
                  {open && (
                    <div className="space-y-2 border-t p-4 text-sm">
                      <div>Телефон: {customer.telephone || '—'}</div>
                      <div>Имейл: {customer.email || '—'}</div>
                      <div>Оригинален статус: {shipment.raw_delivery_status || '—'}</div>
                      <div>Последен sync: {clock(shipment.last_sync_at)}</div>
                      {shipment.last_sync_error ? <div className="text-red-700">Грешка: {shipment.last_sync_error}</div> : null}
                      <div>
                        <div className="font-medium">Проследяване</div>
                        {events.length === 0 ? <p className="text-gray-500">Няма записани събития от Еконт.</p> : (
                          <ul className="mt-1 space-y-1">
                            {events.map((event: any, index: number) => (
                              <li key={index}>{clock(event.event_time)} · {event.description || event.event_type || '—'} {event.city ? `· ${event.city}` : ''}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {shipment.storedId ? <button type="button" className="rounded border px-2 py-1" onClick={() => refreshEcont([shipment.storedId])}>Обнови тази пратка</button> : null}
                        {shipment.label_pdf_url ? <a className="rounded border px-2 py-1" href={shipment.label_pdf_url} target="_blank" rel="noreferrer">Виж товарителницата</a> : null}
                        <button type="button" className="rounded border px-2 py-1" onClick={() => navigator.clipboard.writeText(String(shipment.shipment_number || ''))}>Копирай номер</button>
                        {shipment.storedId ? <button type="button" className="rounded border px-2 py-1" onClick={() => saveAction(shipment.storedId, 'contact_needed')}>За контакт</button> : null}
                        {shipment.storedId ? <button type="button" className="rounded border px-2 py-1" onClick={() => saveAction(shipment.storedId, 'stock_verified')}>Стоката е проверена</button> : null}
                      </div>
                      <textarea
                        className="w-full rounded border p-2"
                        placeholder="Вътрешна бележка"
                        value={noteDraft[shipment.id] || ''}
                        onChange={(e) => setNoteDraft({ ...noteDraft, [shipment.id]: e.target.value })}
                      />
                      {shipment.storedId ? <button type="button" className="rounded border px-2 py-1" onClick={() => saveAction(shipment.storedId, 'internal_note')}>Добави бележка</button> : null}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-2 text-sm">
              <span>Страница {page} · {total} филтрирани</span>
              <div className="flex gap-2">
                <button type="button" className="rounded border px-3 py-1" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Назад</button>
                <button type="button" className="rounded border px-3 py-1" disabled={page * 20 >= total} onClick={() => setPage((value) => value + 1)}>Напред</button>
              </div>
            </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-white/95 p-3 text-sm shadow-lg">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
            <strong>{selectedIds.length ? `Избрани: ${selectedIds.length} пратки` : 'Текуща страница'}</strong>
            {totals ? (
              <>
                <span>Заявен {formatEur(totals.expectedCod)}</span>
                <span>Събран {formatEur(totals.collectedCod)}</span>
                <span>Изплатен {formatEur(totals.paidCod)}</span>
                <span>Събран, неизплатен {formatEur(totals.collectedUnpaid)}</span>
                <span>Върнати {totals.returnedCount}</span>
                <span>Непълни {totals.unknownFinancialCount}</span>
              </>
            ) : (
              <span className="text-gray-500">Изберете пратки за финансова сума. Липсващите суми не се превръщат в нула.</span>
            )}
          </div>
        </div>
      </AdminPage>
    </AdminLayout>
  );
}
