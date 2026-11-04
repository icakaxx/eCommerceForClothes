import 'server-only';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { callCreateLabel, computeValidationHash, isPdfUrlSafe, validationExpiry } from '@/lib/econt/labels';
import { findCityByName, normalizeCityLabel, resolveOfficeInCity } from '@/lib/econt/nomenclatures';
import { roundMoney } from '@/lib/econt/money';
import { mapStatusRow, fetchShipmentStatuses } from '@/lib/econt/tracking';
import { EcontAppError } from '@/lib/econt/types';
import type { ShipmentDraftConfig } from '@/lib/econt/types';
import { computeProductCodFromOrder, validateShipmentDraft } from '@/lib/econt/validation';
import { reconcileFinancialSources } from '@/lib/econt/reconciliation';
import { getEcontRuntimeEnv } from '@/lib/econt/config';

export async function logShipmentAudit(params: {
  shipmentId?: string;
  orderId?: string;
  adminId: string;
  operation: string;
  result: string;
  safeErrorCode?: string;
  payload?: Record<string, unknown>;
}) {
  await supabaseAdmin.from('econt_shipment_audit_logs').insert({
    shipment_id: params.shipmentId ?? null,
    order_id: params.orderId ?? null,
    admin_identifier: params.adminId,
    operation: params.operation,
    result: params.result,
    safe_error_code: params.safeErrorCode ?? null,
    payload: params.payload ?? null,
  });
}

export async function loadOrderForShipment(orderId: string) {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(
      `*, customers(*), order_items(orderitemid, quantity, price, productid, productvariantid, products(name))`
    )
    .eq('orderid', orderId)
    .single();
  if (error || !data) throw new EcontAppError({
    code: 'ORDER_NOT_FOUND',
    title: 'Поръчката не е намерена',
    message: 'Не намерихме поръчка с този номер.',
    httpStatus: 404,
  });
  return data as Record<string, unknown>;
}

export function computeCodForOrder(order: Record<string, unknown>): number {
  const items = (order.order_items as Array<{ price: number; quantity: number }>) ?? [];
  const discountAmount = Number(order.discountamount ?? 0);
  return computeProductCodFromOrder({ items, discountAmount });
}

export async function getSenderProfile(id: string) {
  const { data, error } = await supabaseAdmin.from('econt_sender_profiles').select('*').eq('id', id).single();
  if (error || !data) {
    throw new EcontAppError({
      code: 'SENDER_NOT_FOUND',
      title: 'Подателят не е намерен',
      message: 'Изберете валиден профил на подател.',
      httpStatus: 404,
    });
  }
  return data;
}

export async function pickDefaultSenderProfileId(): Promise<string | null> {
  const { data: lastUsed } = await supabaseAdmin
    .from('econt_sender_profiles')
    .select('id')
    .eq('is_active', true)
    .order('last_used_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (lastUsed?.id) return lastUsed.id;

  const { data: defaultProfile } = await supabaseAdmin
    .from('econt_sender_profiles')
    .select('id')
    .eq('is_active', true)
    .eq('is_default', true)
    .limit(1)
    .maybeSingle();
  return defaultProfile?.id ?? null;
}

export async function ensureDraftShipment(orderId: string) {
  const { data: existing } = await supabaseAdmin
    .from('econt_shipments')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  if (existing?.shipment_number) {
    throw new EcontAppError({
      code: 'SHIPMENT_EXISTS',
      title: 'Товарителницата вече съществува',
      message: 'За тази поръчка вече има създадена товарителница.',
      suggestion: 'Отворете я или я проследете.',
      httpStatus: 409,
    });
  }

  if (existing) return existing;

  const order = await loadOrderForShipment(orderId);
  const computed = computeCodForOrder(order);
  const senderProfileId = await pickDefaultSenderProfileId();
  const environment = getEcontRuntimeEnv();

  const { data: created, error } = await supabaseAdmin
    .from('econt_shipments')
    .insert({
      order_id: orderId,
      environment,
      delivery_type: String(order.deliverytype ?? 'office'),
      computed_cod_amount: computed,
      expected_cod_amount: computed,
      sender_profile_id: senderProfileId,
      merchant_delivery_cost: Number(order.deliverycost ?? 0),
      draft_config: { packageCount: 1, description: 'Дреха', payAfterAccept: true, payAfterTest: true, smsNotification: true },
      creation_state: 'draft',
      validation_state: 'none',
    })
    .select('*')
    .single();

  if (error) {
    const envConstraint = error.message.includes('econt_shipments_environment_check');
    throw new EcontAppError({
      code: 'DB_ERROR',
      title: 'Грешка при запис',
      message: envConstraint
        ? 'Базата не позволява production още — нужна е миграция.'
        : 'Не успяхме да запазим черновата на пратката.',
      suggestion: envConstraint
        ? 'В Supabase SQL Editor изпълнете database/migrations/migration-add-econt-production-environment.sql'
        : error.message,
      httpStatus: 500,
      raw: error.message,
    });
  }
  return created;
}

export async function buildReceiverContext(order: Record<string, unknown>, draft: ShipmentDraftConfig) {
  const customer = (order.customers as Record<string, unknown>) ?? {};
  const deliveryType = String(order.deliverytype ?? 'office');

  let cityId = draft.receiverCityId;
  let cityName = draft.receiverCityName
    ? normalizeCityLabel(draft.receiverCityName)
    : normalizeCityLabel(String(customer.city ?? ''));

  if (!cityId) {
    const city = await findCityByName(cityName);
    cityId = city?.id;
    if (city?.name) cityName = normalizeCityLabel(city.name);
  }

  let officeCode = draft.receiverOfficeCode;
  let officeName = draft.receiverOfficeName;
  if (deliveryType === 'office' && cityId) {
    const resolved = await resolveOfficeInCity({
      cityId,
      officeCode,
      officeName: officeName ?? String(order.econtoffice ?? ''),
    });
    if (resolved.ambiguous) {
      throw new EcontAppError({
        code: 'ECONT_AMBIGUOUS_OFFICE',
        field: 'receiverOfficeCode',
        title: 'Неясно съвпадение на офис',
        message: 'Има повече от един офис с подобно име. Изберете офис ръчно.',
        httpStatus: 400,
      });
    }
    if (resolved.office) {
      officeCode = resolved.office.code;
      officeName = resolved.office.name;
    }
  }

  return {
    firstName: String(customer.firstname ?? ''),
    lastName: String(customer.lastname ?? ''),
    phone: String(customer.telephone ?? ''),
    email: String(customer.email ?? ''),
    cityName,
    cityId,
    deliveryType,
    officeCode,
    officeName,
    address: draft.receiverAddress ?? {
      street: String(order.deliverystreet ?? ''),
      num: String(order.deliverystreetnumber ?? ''),
      other: [order.deliveryentrance, order.deliveryfloor, order.deliveryapartment]
        .filter(Boolean)
        .join(', '),
    },
  };
}

export async function validateAndPersistShipment(params: {
  shipmentId: string;
  adminId: string;
  draft: ShipmentDraftConfig;
}) {
  const { data: shipment, error } = await supabaseAdmin
    .from('econt_shipments')
    .select('*')
    .eq('id', params.shipmentId)
    .single();
  if (error || !shipment) throw new EcontAppError({ code: 'NOT_FOUND', title: 'Пратката не е намерена', message: 'Липсва запис.', httpStatus: 404 });
  if (shipment.shipment_number) {
    throw new EcontAppError({
      code: 'SHIPMENT_EXISTS',
      title: 'Товарителницата вече съществува',
      message: 'Валидацията не е необходима — вече има номер.',
      httpStatus: 409,
    });
  }

  const order = await loadOrderForShipment(shipment.order_id);
  const computed = computeCodForOrder(order);
  const senderProfileId = params.draft.senderProfileId ?? shipment.sender_profile_id;
  if (!senderProfileId) {
    throw new EcontAppError({
      code: 'SENDER_REQUIRED',
      field: 'senderProfileId',
      title: 'Липсва подател',
      message: 'Изберете профил на подател.',
      httpStatus: 400,
    });
  }
  const sender = await getSenderProfile(senderProfileId);
  const receiver = await buildReceiverContext(order, params.draft);

  validateShipmentDraft({
    sender: {
      firstName: sender.first_name,
      lastName: sender.last_name,
      phone: sender.phone,
      cityName: sender.city_name,
      officeCode: sender.office_code,
    },
    receiver: {
      firstName: receiver.firstName,
      lastName: receiver.lastName,
      phone: receiver.phone,
      deliveryType: receiver.deliveryType,
      cityName: receiver.cityName,
      officeCode: receiver.officeCode,
      address: receiver.address,
    },
    draft: params.draft,
    expectedCod: computed,
  });

  const codAmount = roundMoney(params.draft.codOverrideAmount ?? computed);
  const deliveryPayer = params.draft.deliveryPayer ?? 'receiver';
  const addressForLabel =
    receiver.deliveryType === 'address' && receiver.address?.street && receiver.address?.num
      ? { street: receiver.address.street, num: receiver.address.num, other: receiver.address.other }
      : undefined;

  const labelParams = {
    mode: 'validate' as const,
    sender: {
      name: `${sender.first_name} ${sender.last_name}`.trim(),
      phones: [sender.phone],
      officeCode: sender.office_code,
    },
    receiver: {
      name: `${receiver.firstName} ${receiver.lastName}`.trim(),
      phones: [receiver.phone],
      deliveryType: receiver.deliveryType === 'address' ? ('address' as const) : ('office' as const),
      officeCode: receiver.officeCode,
      cityId: receiver.cityId,
      address: addressForLabel,
    },
    draft: params.draft,
    codAmount,
    deliveryPayer,
    notifyEmail: params.draft.emailNotification ? receiver.email : undefined,
  };

  const payload = labelParams;
  const apiResult = await callCreateLabel(labelParams);
  const hash = computeValidationHash(labelParams as unknown as Record<string, unknown>);

  await supabaseAdmin
    .from('econt_sender_profiles')
    .update({ last_used_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', senderProfileId);

  const senderSnapshot = {
    displayName: sender.display_name,
    firstName: sender.first_name,
    lastName: sender.last_name,
    phone: sender.phone,
    cityName: sender.city_name,
    officeCode: sender.office_code,
    officeName: sender.office_name,
  };
  const receiverSnapshot = receiver;

  await supabaseAdmin
    .from('econt_shipments')
    .update({
      sender_profile_id: senderProfileId,
      sender_snapshot: senderSnapshot,
      receiver_snapshot: receiverSnapshot,
      draft_config: params.draft,
      weight: params.draft.weight,
      package_count: params.draft.packageCount ?? 1,
      description: params.draft.description ?? 'Дреха',
      delivery_payer: deliveryPayer,
      computed_cod_amount: computed,
      expected_cod_amount: codAmount,
      cod_override_amount: params.draft.codOverrideAmount ?? null,
      validation_state: 'valid',
      validation_hash: hash,
      validation_expires_at: validationExpiry().toISOString(),
      last_validated_at: new Date().toISOString(),
      diagnostics: { validateResponse: apiResult },
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.shipmentId);

  await logShipmentAudit({
    shipmentId: params.shipmentId,
    orderId: shipment.order_id,
    adminId: params.adminId,
    operation: 'validate',
    result: 'success',
  });

  return { apiResult, codAmount, computed, validationHash: hash };
}

export async function createShipmentLabel(params: { shipmentId: string; adminId: string; validationHash: string }) {
  const { data: shipment } = await supabaseAdmin.from('econt_shipments').select('*').eq('id', params.shipmentId).single();
  if (!shipment) throw new EcontAppError({ code: 'NOT_FOUND', title: 'Пратката не е намерена', message: 'Липсва запис.', httpStatus: 404 });
  if (shipment.shipment_number) {
    throw new EcontAppError({
      code: 'SHIPMENT_EXISTS',
      title: 'Товарителницата вече съществува',
      message: 'Не може да се създаде повторно.',
      httpStatus: 409,
    });
  }
  if (shipment.validation_state !== 'valid' || shipment.validation_hash !== params.validationHash) {
    throw new EcontAppError({
      code: 'STALE_VALIDATION',
      title: 'Валидацията е остаряла',
      message: 'Променихте данни или валидацията е изтекла. Валидирайте отново.',
      httpStatus: 400,
    });
  }
  if (shipment.validation_expires_at && new Date(shipment.validation_expires_at) < new Date()) {
    throw new EcontAppError({
      code: 'STALE_VALIDATION',
      title: 'Валидацията е изтекла',
      message: 'Валидирайте отново преди създаване.',
      httpStatus: 400,
    });
  }

  const draft = (shipment.draft_config ?? {}) as ShipmentDraftConfig;
  const order = await loadOrderForShipment(shipment.order_id);
  const sender = await getSenderProfile(shipment.sender_profile_id);
  const receiver = await buildReceiverContext(order, draft);
  const codAmount = Number(shipment.expected_cod_amount ?? computeCodForOrder(order));

  try {
    const apiResult = await callCreateLabel({
      mode: 'create',
      sender: {
        name: `${sender.first_name} ${sender.last_name}`.trim(),
        phones: [sender.phone],
        officeCode: sender.office_code,
      },
      receiver: {
        name: `${receiver.firstName} ${receiver.lastName}`.trim(),
        phones: [receiver.phone],
        deliveryType: receiver.deliveryType === 'address' ? 'address' : 'office',
        officeCode: receiver.officeCode,
        cityId: receiver.cityId,
        address:
          receiver.deliveryType === 'address' && receiver.address?.street && receiver.address?.num
            ? { street: receiver.address.street, num: receiver.address.num, other: receiver.address.other }
            : undefined,
      },
      draft,
      codAmount,
      deliveryPayer: (shipment.delivery_payer as 'receiver' | 'sender') ?? 'receiver',
    });

    const shipmentNumber = apiResult.label?.shipmentNumber;
    const pdf = apiResult.label?.pdfURL;
    if (!shipmentNumber) {
      throw new EcontAppError({
        code: 'ECONT_CREATE_UNCERTAIN',
        title: 'Неясно състояние след създаване',
        message: 'Не можем да потвърдим дали Еконт е създал товарителницата.',
        retryable: false,
        httpStatus: 502,
      });
    }

    await supabaseAdmin
      .from('econt_shipments')
      .update({
        shipment_number: shipmentNumber,
        creation_state: 'created',
        label_pdf_url: isPdfUrlSafe(pdf) ? pdf : null,
        total_price: apiResult.label?.totalPrice ?? null,
        normalized_delivery_status: 'prepared',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.shipmentId);

    await logShipmentAudit({ shipmentId: params.shipmentId, orderId: shipment.order_id, adminId: params.adminId, operation: 'create', result: 'success' });
    return { shipmentNumber, pdfURL: isPdfUrlSafe(pdf) ? pdf : null };
  } catch (err) {
    await supabaseAdmin
      .from('econt_shipments')
      .update({ creation_state: 'uncertain', updated_at: new Date().toISOString() })
      .eq('id', params.shipmentId);
    await logShipmentAudit({
      shipmentId: params.shipmentId,
      orderId: shipment.order_id,
      adminId: params.adminId,
      operation: 'create',
      result: 'failed',
      safeErrorCode: err instanceof EcontAppError ? err.code : 'UNKNOWN',
    });
    throw err;
  }
}

export async function syncShipmentsByIds(shipmentIds: string[]) {
  const { data: shipments } = await supabaseAdmin
    .from('econt_shipments')
    .select('id, shipment_number')
    .in('id', shipmentIds)
    .not('shipment_number', 'is', null);

  const numbers = (shipments ?? []).map((s) => s.shipment_number).filter(Boolean) as string[];
  if (numbers.length === 0) return { processed: 0, success: 0, failure: 0 };

  const statuses = await fetchShipmentStatuses(numbers);
  let success = 0;
  let failure = 0;

  for (const entry of statuses) {
    const mapped = mapStatusRow(entry);
    const shipment = (shipments ?? []).find((s) => s.shipment_number === mapped.shipmentNumber);
    if (entry.error || !entry.status || !shipment || !mapped.shipmentNumber) {
      failure += 1;
      if (shipment) {
        await supabaseAdmin
          .from('econt_shipments')
          .update({
            last_sync_attempt_at: new Date().toISOString(),
            last_sync_error: entry.error?.message ?? 'No status',
          })
          .eq('id', shipment.id);
      }
      continue;
    }

    const recon = reconcileFinancialSources({
      trackingCollected: mapped.collectedAmount,
      trackingPaid: mapped.paidAmount,
      reportPaid: null,
      currency: 'EUR',
    });

    await supabaseAdmin
      .from('econt_shipments')
      .update({
        raw_delivery_status: mapped.rawStatus,
        normalized_delivery_status: mapped.normalized,
        collected_cod_amount: mapped.collectedAmount,
        collected_cod_currency: mapped.collectedCurrency,
        collected_cod_at: mapped.collectedAt?.toISOString() ?? null,
        paid_cod_amount: mapped.paidAmount,
        paid_cod_currency: mapped.paidCurrency,
        paid_cod_at: mapped.paidAt?.toISOString() ?? null,
        total_price: mapped.totalPrice,
        sender_due_amount: mapped.senderDueAmount,
        receiver_due_amount: mapped.receiverDueAmount,
        label_pdf_url: isPdfUrlSafe(mapped.pdfURL) ? mapped.pdfURL : undefined,
        financial_discrepancy: recon.discrepancy ? { notes: recon.notes } : null,
        last_sync_at: new Date().toISOString(),
        last_sync_attempt_at: new Date().toISOString(),
        last_sync_error: null,
        returned_at: mapped.normalized === 'returned' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shipment.id);

    for (const [idx, ev] of (mapped.trackingEvents as Array<Record<string, unknown>>).entries()) {
      const key = String(ev.id ?? ev.time ?? idx);
      await supabaseAdmin.from('econt_tracking_events').upsert(
        {
          shipment_id: shipment.id,
          source_event_key: key,
          event_time: ev.time ? new Date(String(ev.time)).toISOString() : null,
          event_type: String(ev.type ?? ev.event ?? ''),
          description: String(ev.description ?? ev.name ?? ''),
          city: String(ev.city ?? ''),
          office: String(ev.office ?? ''),
          original_payload: ev,
        },
        { onConflict: 'shipment_id,source_event_key' }
      );
    }
    success += 1;
  }

  return { processed: numbers.length, success, failure };
}
