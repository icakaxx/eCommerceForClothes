'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import EcontDemoBanner from '../components/econt/EcontDemoBanner';
import { AdminPage, PageHeader } from '../components/layout';
import { getAdminSession } from '@/lib/auth';
import { adminAuthHeaders } from '@/lib/admin-auth-headers';
import { formatEur } from '@/lib/econt/money';
import { STATUS_LABELS_BG } from '@/lib/econt/status-mapper';

export default function ShipmentTrackingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState<any[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [totals, setTotals] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: '1', pageSize: '50', status: statusFilter });
    const res = await fetch(`/api/admin/econt/tracking?${params}`, { headers: await adminAuthHeaders() });
    const data = await res.json();
    if (data.success) {
      setShipments(data.shipments ?? []);
      setSummary(data.summary ?? {});
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    getAdminSession().then((s) => {
      if (!s) router.push('/admin/login');
      else load();
    });
  }, [router, load]);

  const selectedIds = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);

  const refreshSelected = async () => {
    await fetch('/api/admin/econt/shipments/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await adminAuthHeaders()) },
      body: JSON.stringify({ shipmentIds: selectedIds.length ? selectedIds : undefined }),
    });
    await load();
  };

  const calcTotals = async () => {
    const res = await fetch('/api/admin/econt/reports/selected', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await adminAuthHeaders()) },
      body: JSON.stringify({ shipmentIds: selectedIds }),
    });
    const data = await res.json();
    if (data.success) setTotals(data.totals);
  };

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

  return (
    <AdminLayout currentPath="/admin/shipment-tracking">
      <AdminPage>
        <PageHeader title="Проследи пратки" />
        <EcontDemoBanner />
        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5">
          {[
            ['all', 'Всички'],
            ['in_transit', 'В движение'],
            ['in_office', 'В офис'],
            ['delivered', 'Доставени'],
            ['returning', 'Връщат се'],
            ['returned', 'Върнати'],
          ].map(([key, label]) => (
            <div key={key} className="rounded-xl border p-3 text-sm">
              <div className="text-gray-500">{label}</div>
              <div className="text-xl font-semibold">{key === 'all' ? (summary.all as number) ?? 0 : (summary as any)[key.replace('_', '')] ?? 0}</div>
            </div>
          ))}
        </div>
        <p className="mb-3 text-xs text-gray-500">Последна синхронизация: {(summary.lastSyncAt as string) ?? '—'}</p>
        <div className="mb-4 flex flex-wrap gap-2">
          <select className="rounded-lg border px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Всички</option>
            {Object.entries(STATUS_LABELS_BG).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={refreshSelected}>Обнови статусите</button>
          <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={calcTotals} disabled={!selectedIds.length}>Суми за избраните ({selectedIds.length})</button>
          <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={exportCsv} disabled={!selectedIds.length}>CSV</button>
        </div>
        {totals && (
          <div className="mb-4 rounded-xl border p-4 text-sm grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>Общ наложен: <strong>{formatEur(totals.expectedCod)}</strong></div>
            <div>Събран: <strong>{formatEur(totals.collectedCod)}</strong></div>
            <div>Изплатен: <strong>{formatEur(totals.paidCod)}</strong></div>
            <div>Събран, неизплатен: <strong>{formatEur(totals.collectedUnpaid)}</strong></div>
            <div>Върнати: <strong>{totals.returnedCount}</strong></div>
            <div>Стойност върнати: <strong>{formatEur(totals.returnedOrderValue)}</strong></div>
            <div>Разходи доставка: <strong>{formatEur(totals.merchantDeliveryCost)}</strong></div>
            <div>Непълни фин. данни: <strong>{totals.unknownFinancialCount}</strong></div>
          </div>
        )}
        {loading ? (
          <p>Зареждане...</p>
        ) : (
          <div className="space-y-2">
            {shipments.map((s) => {
              const open = expanded[s.id];
              const customer = s.orders?.customers ?? {};
              return (
                <div key={s.id} className="rounded-xl border">
                  <div className="flex flex-wrap items-center gap-2 p-3 text-sm">
                    <input type="checkbox" checked={!!selected[s.id]} onChange={(e) => setSelected({ ...selected, [s.id]: e.target.checked })} />
                    <button type="button" onClick={() => setExpanded({ ...expanded, [s.id]: !open })}>{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                    <Link href={`/admin/sales`} className="underline">{s.order_id}</Link>
                    <span className="font-medium">{s.shipment_number}</span>
                    <span>{customer.firstname} {customer.lastname}</span>
                    <span>{STATUS_LABELS_BG[s.normalized_delivery_status as keyof typeof STATUS_LABELS_BG] ?? s.normalized_delivery_status}</span>
                    <span>{formatEur(s.expected_cod_amount)}</span>
                    <span className="text-gray-500">събран {s.collected_cod_amount != null ? formatEur(s.collected_cod_amount) : '—'}</span>
                    <span className="text-gray-500">изплатен {s.paid_cod_amount != null ? formatEur(s.paid_cod_amount) : '—'}</span>
                  </div>
                  {open && (
                    <div className="border-t p-4 text-sm space-y-1">
                      <div>Създадена: {s.created_at}</div>
                      <div>Последен sync: {s.last_sync_at ?? '—'}</div>
                      <div>Raw status: {s.raw_delivery_status ?? '—'}</div>
                      {s.label_pdf_url && (
                        <a className="text-blue-600 underline" href={s.label_pdf_url} target="_blank" rel="noreferrer">PDF етикет</a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AdminPage>
    </AdminLayout>
  );
}
