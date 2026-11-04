import 'server-only';

import crypto from 'crypto';
import { econtPost } from '@/lib/econt/client';
import type { LabelCreateResponse, ShipmentDraftConfig } from '@/lib/econt/types';

export type BuildLabelParams = {
  mode: 'validate' | 'create';
  sender: {
    name: string;
    phones: string[];
    officeCode: string;
  };
  receiver: {
    name: string;
    phones: string[];
    deliveryType: 'office' | 'address';
    officeCode?: string;
    cityId?: number;
    address?: { street: string; num: string; other?: string };
  };
  draft: ShipmentDraftConfig;
  codAmount: number;
  deliveryPayer: 'receiver' | 'sender';
  notifyEmail?: string;
};

export function buildLabelPayload(params: BuildLabelParams) {
  const payerSender = params.deliveryPayer === 'sender';
  const label: Record<string, unknown> = {
    senderClient: { name: params.sender.name, phones: params.sender.phones },
    senderOfficeCode: params.sender.officeCode,
    receiverClient: { name: params.receiver.name, phones: params.receiver.phones },
    packCount: params.draft.packageCount ?? 1,
    shipmentType: 'pack',
    weight: params.draft.weight,
    sizeUnder60cm: true,
    shipmentDescription: params.draft.description ?? 'Дреха',
    payAfterAccept: params.draft.payAfterAccept ?? true,
    payAfterTest: params.draft.payAfterTest ?? true,
    paymentSenderMethod: payerSender ? 'cash' : '',
    paymentReceiverMethod: payerSender ? '' : 'cash',
    services: {
      cdAmount: params.codAmount,
      cdType: 'get',
      cdCurrency: 'EUR',
    },
    instructions: [
      {
        type: 'return',
        returnInstructionParams: {
          returnParcelDestination: 'sender',
          returnParcelPaymentSide: 'sender',
          rejectAction: 'return_to_sender',
          rejectOriginalParcelPaySide: 'receiver',
          rejectReturnParcelPaySide: 'sender',
        },
      },
    ],
  };

  if (params.receiver.deliveryType === 'office' && params.receiver.officeCode) {
    label.receiverOfficeCode = params.receiver.officeCode;
  } else if (params.receiver.cityId && params.receiver.address) {
    label.receiverAddress = {
      city: { id: params.receiver.cityId },
      street: params.receiver.address.street,
      num: params.receiver.address.num,
      other: params.receiver.address.other ?? '',
    };
  }

  if (params.notifyEmail) {
    label.receiverClient = {
      ...(label.receiverClient as Record<string, unknown>),
      email: params.notifyEmail,
    };
  }

  return { mode: params.mode, label };
}

export async function callCreateLabel(params: BuildLabelParams): Promise<LabelCreateResponse> {
  const payload = buildLabelPayload(params);
  const { data } = await econtPost<LabelCreateResponse>(
    'Shipments/LabelService.createLabel.json',
    payload
  );
  return data;
}

export function computeValidationHash(payload: Record<string, unknown>): string {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function validationExpiry(minutes = 15): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function isPdfUrlSafe(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname.includes('econt');
  } catch {
    return false;
  }
}
