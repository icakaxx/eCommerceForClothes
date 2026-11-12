'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Check, CheckCircle2, Printer, Sparkles } from 'lucide-react';
import { shipmentRowHighlight } from '@/lib/econt/row-highlight';
import AdminLayout from '../components/AdminLayout';
import EcontDemoBanner from '../components/econt/EcontDemoBanner';
import SenderProfilesPanel, { useSenderOptions } from '../components/econt/SenderProfilesPanel';
import EcontReceiverFields, { type ReceiverEcontSelection } from '../components/econt/EcontReceiverFields';
import { AdminPage, PageHeader } from '../components/layout';
import { getAdminSession } from '@/lib/auth';
import { adminAuthHeaders } from '@/lib/admin-auth-headers';
import { formatEur, parseMoney, roundMoney } from '@/lib/econt/money';
import { formatAdminOrderItemLine, variantDisplayFromOrderItem, orderItemProductName } from '@/lib/order-item-display';

type Tab = 'labels' | 'senders';

function hasCreatedLabel(labelState: string, shipment: { shipment_number?: string | null } | null) {
  return labelState === 'created' || Boolean(shipment?.shipment_number);
}

function shipmentStatusBadge(highlight: ReturnType<typeof shipmentRowHighlight>) {
  if (highlight === 'latest') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/90 px-2.5 py-0.5 text-xs font-semibold text-amber-950">
        <Sparkles size={13} aria-hidden="true" />
        Последна товарителница
      </span>
    );
  }
  if (highlight === 'created') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
        <Check size={14} strokeWidth={3} />
        Създадена
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
      Без товарителница
    </span>
  );
}

function rowHighlightClass(highlight: ReturnType<typeof shipmentRowHighlight>) {
  if (highlight === 'latest') {
    return 'border-amber-300 bg-amber-50 ring-1 ring-amber-200/80';
  }
  if (highlight === 'created') {
    return 'border-emerald-200 bg-emerald-50/80';
  }
  return 'border-gray-200 bg-white';
}

/** Admin-readable snapshot of order + econt_shipments row (for Details panel). */
function buildEcontShipmentDetailsJson(order: Record<string, unknown>, shipment: Record<string, unknown> | null) {
  const customer = (order.customers as Record<string, unknown> | undefined) ?? {};
  const base = {
    order: {
      orderId: order.orderid,
      status: order.status,
      deliveryType: order.deliverytype,
      customer: {
        firstName: customer.firstname,
        lastName: customer.lastname,
        phone: customer.telephone,
        email: customer.email,
        city: customer.city,
      },
      delivery: {
        econtOffice: order.econtoffice ?? null,
        notes: order.deliverynotes ?? null,
        street: order.deliverystreet ?? null,
        streetNumber: order.deliverystreetnumber ?? null,
        entrance: order.deliveryentrance ?? null,
        floor: order.deliveryfloor ?? null,
        apartment: order.deliveryapartment ?? null,
      },
      amounts: {
        subtotal: order.subtotal,
        deliveryCost: order.deliverycost,
        discount: order.discountamount,
        total: order.total,
      },
      items: (order.order_items as Array<Record<string, unknown>> | undefined)?.map((item) => {
        const variant = variantDisplayFromOrderItem(item as { product_variants?: unknown });
        return {
          name: orderItemProductName(item as { products?: { name?: string } }),
          quantity: item.quantity,
          price: item.price,
          size: variant.size ?? null,
          variantProperties: variant.properties,
        };
      }),
    },
  };

  if (!shipment) {
    return { ...base, econtShipment: null, note: 'Няма запис в econt_shipments — отворете „Направи товарителница“.' };
  }

  return {
    ...base,
    econtShipment: {
      id: shipment.id,
      environment: shipment.environment,
      shipmentNumber: shipment.shipment_number ?? null,
      senderProfileId: shipment.sender_profile_id,
      senderSnapshot: shipment.sender_snapshot ?? null,
      receiverSnapshot: shipment.receiver_snapshot ?? null,
      draftConfig: shipment.draft_config ?? null,
      deliveryType: shipment.delivery_type,
      deliveryPayer: shipment.delivery_payer,
      packageCount: shipment.package_count,
      weight: (shipment.draft_config as Record<string, unknown> | undefined)?.weight ?? null,
      description: shipment.description,
      cod: {
        expected: shipment.expected_cod_amount,
        computed: shipment.computed_cod_amount,
        override: shipment.cod_override_amount,
        currency: shipment.cod_currency,
      },
      states: {
        validation: shipment.validation_state,
        creation: shipment.creation_state,
        normalizedDeliveryStatus: shipment.normalized_delivery_status,
        rawDeliveryStatus: shipment.raw_delivery_status,
      },
      validation: {
        lastValidatedAt: shipment.last_validated_at,
        validationExpiresAt: shipment.validation_expires_at,
      },
      tracking: {
        lastSyncAt: shipment.last_sync_at,
        collectedCod: shipment.collected_cod_amount,
        paidCod: shipment.paid_cod_amount,
      },
      timestamps: {
        createdAt: shipment.created_at,
        updatedAt: shipment.updated_at,
      },
    },
  };
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
  const [codInput, setCodInput] = useState('');
  const { senders, reloadSenders, loadingSenders } = useSenderOptions();
  const [senderProfileId, setSenderProfileId] = useState('');
  const [latestCreated, setLatestCreated] = useState<{
    shipmentId: string;
    orderId: string | null;
    shipmentNumber: string | null;
    createdAt: string;
  } | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    shipmentNumber: string;
    pdfURL: string | null;
    recipientName: string;
    recipientPhone: string;
    recipientCity: string;
    orderId: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20', filter, q });
    const res = await fetch(`/api/admin/econt/shipments?${params}`, { headers: await adminAuthHeaders() });
    const data = await res.json();
    if (data.success) {
      setRows(data.rows ?? []);
      setSummary(data.summary ?? {});
      setLatestCreated(data.latestCreated ?? null);
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
    const sh = data.shipment as {
      computed_cod_amount?: number;
      expected_cod_amount?: number;
      cod_override_amount?: number | null;
    };
    const preset =
      sh.cod_override_amount != null && sh.expected_cod_amount != null
        ? Number(sh.expected_cod_amount)
        : Number(sh.computed_cod_amount ?? sh.expected_cod_amount ?? 0);
    setCodInput(preset > 0 || preset === 0 ? String(preset) : '');
    setModalOrderId(orderId);
  };

  const presetCodAmount = (): number => {
    const sh = shipmentDraft as { computed_cod_amount?: number } | null;
    return roundMoney(Number(sh?.computed_cod_amount ?? 0));
  };

  const buildCodDraftFields = (): {
    codOverrideAmount?: number;
    codOverrideConfirmed?: boolean;
  } => {
    const preset = presetCodAmount();
    const parsed = parseMoney(codInput);
    if (parsed === null || parsed < 0) return {};
    if (roundMoney(parsed) === preset) return {};
    return { codOverrideAmount: parsed, codOverrideConfirmed: true };
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
    const parsedCod = parseMoney(codInput);
    if (parsedCod === null || parsedCod < 0) {
      setActionError('Въведете валидна сума за наложен платеж (EUR).');
      return;
    }
    const codFields = buildCodDraftFields();
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
          ...codFields,
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
    const shipmentNumber = String(data.shipmentNumber ?? '');
    const pdfURL = typeof data.pdfURL === 'string' ? data.pdfURL : null;
    const customer = modalOrder?.customers ?? {};
    const createdShipmentId = String(shipmentDraft.id);
    const createdOrderId = String(modalOrderId);

    setRows((current) =>
      current.map((row) =>
        row.order?.orderid === createdOrderId
          ? {
              ...row,
              labelState: 'created',
              shipment: {
                ...(row.shipment ?? {}),
                id: createdShipmentId,
                shipment_number: shipmentNumber,
              },
            }
          : row
      )
    );
    setLatestCreated({
      shipmentId: createdShipmentId,
      orderId: createdOrderId,
      shipmentNumber,
      createdAt: new Date().toISOString(),
    });
    setSuccessInfo({
      shipmentNumber,
      pdfURL,
      recipientName: `${customer.firstname ?? ''} ${customer.lastname ?? ''}`.trim() || '—',
      recipientPhone: String(customer.telephone ?? '—'),
      recipientCity: String(customer.city ?? '—'),
      orderId: createdOrderId,
    });
    setModalOrderId(null);
    if (pdfURL) window.open(pdfURL, '_blank', 'noopener,noreferrer');
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
            {latestCreated?.shipmentNumber && (
              <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                <Sparkles size={16} className="shrink-0" aria-hidden="true" />
                <span className="font-medium">Последна товарителница</span>
                <span className="font-mono">{latestCreated.shipmentNumber}</span>
                {latestCreated.orderId ? <span className="text-amber-800">· поръчка {latestCreated.orderId}</span> : null}
              </div>
            )}
            {loading ? (
              <p>Зареждане...</p>
            ) : (
              <div className="space-y-2">
                {rows.map(({ order, shipment, labelState, codAmount }) => {
                  const id = order.orderid;
                  const open = expanded[id];
                  const customer = order.customers ?? {};
                  const labelCreated = hasCreatedLabel(labelState, shipment);
                  const highlight = shipmentRowHighlight({
                    hasLabel: labelCreated,
                    shipmentId: shipment?.id ?? null,
                    latestShipmentId: latestCreated?.shipmentId ?? null,
                  });
                  return (
                    <div
                      key={id}
                      className={`rounded-xl border ${rowHighlightClass(highlight)}`}
                    >
                      <div className="flex flex-wrap items-center gap-3 p-3 text-sm">
                        <button type="button" onClick={() => setExpanded({ ...expanded, [id]: !open })} aria-label="Разшири">
                          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        {highlight === 'latest' && (
                          <CheckCircle2
                            size={22}
                            className="shrink-0 text-amber-600"
                            aria-label="Последна товарителница"
                          />
                        )}
                        {highlight === 'created' && (
                          <CheckCircle2
                            size={22}
                            className="shrink-0 text-emerald-600"
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
                        {shipmentStatusBadge(highlight)}
                        {shipment?.shipment_number ? (
                          <span className="font-mono text-xs text-gray-600">{shipment.shipment_number}</span>
                        ) : null}
                        {labelCreated ? (
                          <button
                            type="button"
                            className={`ml-auto rounded-lg border px-3 py-1.5 ${
                              highlight === 'latest'
                                ? 'border-amber-700 text-amber-950'
                                : 'border-emerald-700 text-emerald-800'
                            }`}
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
                          <div className="whitespace-pre-wrap">
                            <strong>Бележки:</strong>{' '}
                            {(order.deliverynotes ?? '').trim() ? (
                              order.deliverynotes
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </div>
                          <div><strong>Адрес/офис:</strong> {order.econtoffice || [order.deliverystreet, order.deliverystreetnumber].filter(Boolean).join(' ')}</div>
                          <div><strong>Междинна сума:</strong> {formatEur(order.subtotal)} · <strong>Доставка:</strong> {formatEur(order.deliverycost)} · <strong>Общо:</strong> {formatEur(order.total)}</div>
                          <ul className="list-disc pl-5">
                            {(order.order_items ?? []).map((item: any, idx: number) => (
                              <li key={idx}>{formatAdminOrderItemLine(item, formatEur)}</li>
                            ))}
                          </ul>
                          {shipment?.shipment_number && (
                            <div><strong>Номер пратка:</strong> {shipment.shipment_number}</div>
                          )}
                          <div className="pt-2">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <strong>Данни за Econt (JSON)</strong>
                              <button
                                type="button"
                                className="rounded border px-2 py-0.5 text-xs hover:bg-gray-50"
                                onClick={() => {
                                  const text = JSON.stringify(
                                    buildEcontShipmentDetailsJson(order, shipment),
                                    null,
                                    2
                                  );
                                  void navigator.clipboard.writeText(text);
                                }}
                              >
                                Копирай
                              </button>
                            </div>
                            <pre className="max-h-80 overflow-auto rounded-lg border bg-gray-900 p-3 text-xs text-green-100">
                              {JSON.stringify(buildEcontShipmentDetailsJson(order, shipment), null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {successInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
              <div className="mb-3 flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={28} aria-hidden="true" />
                <div>
                  <h3 className="text-lg font-semibold">Товарителницата е създадена</h3>
                  <p className="text-sm text-gray-600">Поръчка {successInfo.orderId}</p>
                </div>
              </div>
              <dl className="mb-4 space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">Получател</dt>
                  <dd className="font-medium text-right">{successInfo.recipientName}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">Телефон</dt>
                  <dd className="text-right">{successInfo.recipientPhone}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">Населено място</dt>
                  <dd className="text-right">{successInfo.recipientCity}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">Номер на пратка</dt>
                  <dd className="font-mono font-semibold text-right">{successInfo.shipmentNumber}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2">
                {successInfo.pdfURL ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-2 text-sm text-white"
                    onClick={() => window.open(successInfo.pdfURL!, '_blank', 'noopener,noreferrer')}
                  >
                    <Printer size={16} aria-hidden="true" />
                    Печат
                  </button>
                ) : null}
                <button
                  type="button"
                  className="rounded-lg border px-3 py-2 text-sm"
                  onClick={() => setSuccessInfo(null)}
                >
                  Затвори
                </button>
              </div>
            </div>
          </div>
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
              <label className="block text-sm mb-1">Наложен платеж / крайна сума (EUR) *</label>
              <input
                className="mb-1 w-full rounded-lg border px-3 py-2 text-sm"
                inputMode="decimal"
                placeholder="0.00"
                value={codInput}
                onChange={(e) => {
                  setCodInput(e.target.value);
                  setValidationHash(null);
                }}
              />
              <p className="mb-3 text-xs text-gray-600">
                По подразбиране: {formatEur(presetCodAmount())} (артикули − отстъпка, без доставка).
                {modalOrder?.total != null ? (
                  <>
                    {' '}
                    Общо поръчка: {formatEur(Number(modalOrder.total))}.
                  </>
                ) : null}{' '}
                Ако промените полето, в Econt отива въведената сума.
              </p>
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
              <p className="mb-3 text-xs text-gray-600">
                Платец доставка: получател. Наложеният платеж е сумата, която клиентът плаща при получаване (може да се различава от общото на поръчката, ако доставката е отделно).
              </p>
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
