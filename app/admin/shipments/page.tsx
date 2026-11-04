'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Check, CheckCircle2, Package } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import EcontDemoBanner from '../components/econt/EcontDemoBanner';
import SenderProfilesPanel, { useSenderOptions } from '../components/econt/SenderProfilesPanel';
import EcontReceiverFields, { type ReceiverEcontSelection } from '../components/econt/EcontReceiverFields';
import { AdminPage, PageHeader } from '../components/layout';
import { getAdminSession } from '@/lib/auth';
import { adminAuthHeaders } from '@/lib/admin-auth-headers';
import { formatEur } from '@/lib/econt/money';

type Tab = 'labels' | 'senders';

function hasCreatedLabel(labelState: string, shipment: { shipment_number?: string | null } | null) {
  return labelState === 'created' || Boolean(shipment?.shipment_number);
}

function labelStateBadge(labelState: string) {
  const map: Record<string, { text: string; className: string }> = {
    without_label: { text: 'Без етикет', className: 'bg-gray-100 text-gray-700' },
    draft: { text: 'Чернова', className: 'bg-gray-100 text-gray-700' },
    ready: { text: 'Готова', className: 'bg-blue-100 text-blue-800' },
    validation_error: { text: 'Грешка при валидация', className: 'bg-amber-100 text-amber-900' },
    error: { text: 'Грешка', className: 'bg-red-100 text-red-800' },
  };
  const item = map[labelState] ?? { text: labelState, className: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${item.className}`}>{item.text}</span>
  );
}

export default function AdminShipmentsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('labels');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [modalOrderId, setModalOrderId] = useState<string | null>(null);
  const [modalOrder, setModalOrder] = useState<any>(null);
  const [receiverEcont, setReceiverEcont] = useState<ReceiverEcontSelection>({});
  const [shipmentDraft, setShipmentDraft] = useState<any>(null);
  const [validationHash, setValidationHash] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [weight, setWeight] = useState('1');
  const { senders, reloadSenders, loadingSenders } = useSenderOptions();
  const [senderProfileId, setSenderProfileId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20', filter, q });
    const res = await fetch(`/api/admin/econt/shipments?${params}`, { headers: await adminAuthHeaders() });
    const data = await res.json();
    if (data.success) {
      setRows(data.rows ?? []);
      setSummary(data.summary ?? {});
    }
    setLoading(false);
  }, [filter, q, page]);

  useEffect(() => {
    getAdminSession().then((s) => {
      if (!s) router.push('/admin/login');
      else load();
    });
  }, [router, load]);

  useEffect(() => {
    if (!senders.length) return;
    const stillValid = senders.some((s) => s.id === senderProfileId);
    if (!stillValid) {
      const def = senders.find((s) => s.is_default) ?? senders[0];
      setSenderProfileId(def.id);
    }
  }, [senders, senderProfileId]);

  const openLabelModal = async (orderId: string) => {
    setActionError(null);
    setValidationHash(null);
    setReceiverEcont({});
    const row = rows.find((r) => r.order?.orderid === orderId);
    setModalOrder(row?.order ?? null);
    await reloadSenders();
    const res = await fetch('/api/admin/econt/shipments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await adminAuthHeaders()) },
      body: JSON.stringify({ orderId }),
    });
    const data = await res.json();
    if (!data.success) {
      const err = data.error;
      setActionError(
        typeof err === 'object' && err?.message
          ? `${err.title ? `${err.title}: ` : ''}${err.message}${err.suggestion ? ` — ${err.suggestion}` : ''}`
          : String(data.error ?? 'Грешка')
      );
      return;
    }
    setShipmentDraft(data.shipment);
    setModalOrderId(orderId);
  };

  const validateShipment = async () => {
    if (!shipmentDraft?.id) return;
    if (modalOrder?.deliverytype === 'office' && !receiverEcont.receiverOfficeCode) {
      setActionError('За доставка до офис изберете валиден офис на Еконт от списъка.');
      return;
    }
    if (modalOrder?.deliverytype === 'address') {
      if (!receiverEcont.receiverCityId) {
        setActionError('За адресна доставка изберете град от списъка на Econt.');
        return;
      }
      const addr = receiverEcont.receiverAddress;
      if (!addr?.street?.trim() || !addr?.num?.trim()) {
        setActionError('Попълнете улица и номер за адресна доставка.');
        return;
      }
    }
    setActionError(null);
    const res = await fetch('/api/admin/econt/shipments/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await adminAuthHeaders()) },
      body: JSON.stringify({
        shipmentId: shipmentDraft.id,
        draft: {
          senderProfileId,
          weight: Number(weight),
          packageCount: 1,
          description: 'Дреха',
          deliveryPayer: 'receiver',
          payAfterAccept: true,
          payAfterTest: true,
          smsNotification: true,
          receiverCityId: receiverEcont.receiverCityId,
          receiverCityName: receiverEcont.receiverCityName,
          receiverOfficeCode: receiverEcont.receiverOfficeCode,
          receiverOfficeName: receiverEcont.receiverOfficeName,
          receiverAddress: receiverEcont.receiverAddress,
        },
      }),
    });
    const data = await res.json();
    if (!data.success) {
      setActionError(data.error?.message ?? data.error?.title ?? 'Грешка при валидация');
      return;
    }
    setValidationHash(data.validationHash);
  };

  const createLabel = async () => {
    if (!shipmentDraft?.id || !validationHash) return;
    setActionError(null);
    const res = await fetch('/api/admin/econt/shipments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await adminAuthHeaders()) },
      body: JSON.stringify({ shipmentId: shipmentDraft.id, validationHash }),
    });
    const data = await res.json();
    if (!data.success) {
      setActionError(data.error?.message ?? 'Грешка при създаване');
      return;
    }
    if (data.pdfURL) window.open(data.pdfURL, '_blank', 'noopener,noreferrer');
    setModalOrderId(null);
    await load();
  };

  return (
    <AdminLayout currentPath="/admin/shipments">
      <AdminPage>
        <PageHeader title="Товарителници" />
        <EcontDemoBanner />
        <div className="mb-4 flex gap-2">
          <button type="button" className={`rounded-full px-4 py-2 text-sm ${tab === 'labels' ? 'bg-black text-white' : 'border'}`} onClick={() => setTab('labels')}>
            Поръчки
          </button>
          <button type="button" className={`rounded-full px-4 py-2 text-sm ${tab === 'senders' ? 'bg-black text-white' : 'border'}`} onClick={() => setTab('senders')}>
            Данни за подател
          </button>
        </div>

        {tab === 'senders' ? (
          <SenderProfilesPanel onSendersChanged={reloadSenders} />
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-5">
              {[
                ['withoutLabel', 'Без товарителница'],
                ['pendingValidation', 'Чакащи валидация'],
                ['readyToCreate', 'Готови'],
                ['created', 'Създадени'],
                ['errors', 'Грешки'],
              ].map(([key, label]) => (
                <div key={key} className="rounded-xl border p-3 text-sm">
                  <div className="text-gray-500">{label}</div>
                  <div className="text-xl font-semibold">{summary[key as string] ?? 0}</div>
                </div>
              ))}
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Търсене..." value={q} onChange={(e) => setQ(e.target.value)} />
              <select className="rounded-lg border px-3 py-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">Всички</option>
                <option value="without_label">Без етикет</option>
                <option value="ready">Готови</option>
                <option value="created">Създадени</option>
                <option value="errors">Грешки</option>
              </select>
              <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => load()}>
                Обнови
              </button>
            </div>
            {loading ? (
              <p>Зареждане...</p>
            ) : (
              <div className="space-y-2">
                {rows.map(({ order, shipment, labelState, codAmount }) => {
                  const id = order.orderid;
                  const open = expanded[id];
                  const customer = order.customers ?? {};
                  const labelCreated = hasCreatedLabel(labelState, shipment);
                  return (
                    <div
                      key={id}
                      className={`rounded-xl border ${labelCreated ? 'border-green-300 bg-green-50/50' : ''}`}
                    >
                      <div className="flex flex-wrap items-center gap-3 p-3 text-sm">
                        <button type="button" onClick={() => setExpanded({ ...expanded, [id]: !open })} aria-label="Разшири">
                          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        {labelCreated && (
                          <CheckCircle2
                            size={22}
                            className="shrink-0 text-green-600"
                            aria-label="Товарителница създадена"
                          />
                        )}
                        <span className="font-medium">{id}</span>
                        <span className="inline-flex items-center gap-1.5">
                          {customer.firstname} {customer.lastname}
                        </span>
                        <span>{customer.telephone}</span>
                        <span>{customer.city}</span>
                        <span>{order.deliverytype}</span>
                        <span>{formatEur(codAmount)} COD</span>
                        {labelCreated ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                            <Check size={14} strokeWidth={3} />
                            Товарителница създадена
                            {shipment?.shipment_number ? ` · ${shipment.shipment_number}` : ''}
                          </span>
                        ) : (
                          labelStateBadge(labelState)
                        )}
                        {labelCreated ? (
                          <button
                            type="button"
                            className="ml-auto rounded-lg border border-green-700 px-3 py-1.5 text-green-800"
                            onClick={() => setExpanded({ ...expanded, [id]: true })}
                          >
                            Детайли
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="ml-auto rounded-lg bg-black px-3 py-1.5 text-white"
                            onClick={() => openLabelModal(id)}
                          >
                            Направи товарителница
                          </button>
                        )}
                      </div>
                      {open && (
                        <div className="border-t p-4 text-sm space-y-2">
                          <div><strong>Статус поръчка:</strong> {order.status}</div>
                          <div><strong>Адрес/офис:</strong> {order.econtoffice || [order.deliverystreet, order.deliverystreetnumber].filter(Boolean).join(' ')}</div>
                          <div><strong>Междинна сума:</strong> {formatEur(order.subtotal)} · <strong>Доставка:</strong> {formatEur(order.deliverycost)} · <strong>Общо:</strong> {formatEur(order.total)}</div>
                          <ul className="list-disc pl-5">
                            {(order.order_items ?? []).map((item: any, idx: number) => (
                              <li key={idx}>{item.products?.name ?? 'Артикул'} × {item.quantity} — {formatEur(item.price)}</li>
                            ))}
                          </ul>
                          {shipment?.shipment_number && (
                            <div><strong>Номер пратка:</strong> {shipment.shipment_number}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {modalOrderId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5">
              <h3 className="text-lg font-semibold mb-2">Товарителница — {modalOrderId}</h3>
              {actionError && <p className="mb-2 text-sm text-red-600">{actionError}</p>}
              <label className="block text-sm mb-1">Подател</label>
              {loadingSenders ? (
                <p className="mb-3 text-sm text-gray-500">Зареждане на податели...</p>
              ) : senders.length === 0 ? (
                <p className="mb-3 text-sm text-amber-700">
                  Няма активни податели. Добавете профил в таб „Данни за подател“ и отворете отново товарителницата.
                </p>
              ) : (
                <select className="mb-3 w-full rounded-lg border px-3 py-2 text-sm" value={senderProfileId} onChange={(e) => setSenderProfileId(e.target.value)}>
                  {senders.map((s) => (
                    <option key={s.id} value={s.id}>{s.display_name}</option>
                  ))}
                </select>
              )}
              <label className="block text-sm mb-1">Тегло (kg) *</label>
              <input
                className="mb-3 w-full rounded-lg border px-3 py-2 text-sm"
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value);
                  setValidationHash(null);
                }}
              />
              {modalOrder && (
                <EcontReceiverFields
                  deliveryType={String(modalOrder.deliverytype ?? 'office')}
                  initialCityName={modalOrder.customers?.city ?? ''}
                  initialOfficeHint={modalOrder.econtoffice ?? ''}
                  initialAddress={{
                    street: modalOrder.deliverystreet ?? '',
                    num: modalOrder.deliverystreetnumber ?? '',
                    other: [modalOrder.deliveryentrance, modalOrder.deliveryfloor, modalOrder.deliveryapartment]
                      .filter(Boolean)
                      .join(', '),
                  }}
                  value={receiverEcont}
                  onChange={(next) => {
                    setReceiverEcont(next);
                    setValidationHash(null);
                  }}
                />
              )}
              <p className="mb-3 text-xs text-gray-600">COD = стойност продукти − отстъпка (без доставка). Платец доставка: получател.</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setModalOrderId(null)}>Затвори</button>
                <button type="button" className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white" onClick={validateShipment}>Валидирай</button>
                <button type="button" className="rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-50" disabled={!validationHash} onClick={createLabel}>Създай</button>
              </div>
            </div>
          </div>
        )}
      </AdminPage>
    </AdminLayout>
  );
}
