import { roundMoney } from '@/lib/econt/money';
import { EcontAppError } from '@/lib/econt/types';
import type { ShipmentDraftConfig } from '@/lib/econt/types';

const PHONE_RE = /^(\+359|0)(87|88|89|98|99|2\d)\d{7}$/;

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[\s\-()]/g, '');
  if (digits.startsWith('+359')) return digits;
  if (digits.startsWith('0')) return `+359${digits.slice(1)}`;
  if (digits.startsWith('359')) return `+${digits}`;
  return digits;
}

export function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 9 && digits.length <= 13;
}

export function isRealEmail(email?: string | null): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  if (!e.includes('@')) return false;
  if (e.endsWith('@checkout.local') || e.endsWith('@admin-orders.local')) return false;
  return true;
}

export function computeProductCodFromOrder(params: {
  items: Array<{ price: number; quantity: number }>;
  discountAmount: number;
}): number {
  const subtotal = params.items.reduce((sum, i) => sum + roundMoney(i.price * i.quantity), 0);
  const discount = roundMoney(Math.max(0, params.discountAmount || 0));
  return roundMoney(Math.max(0, subtotal - discount));
}

export function validateShipmentDraft(params: {
  sender: { firstName: string; lastName: string; phone: string; cityName: string; officeCode: string };
  receiver: {
    firstName: string;
    lastName: string;
    phone: string;
    deliveryType: string;
    cityName: string;
    officeCode?: string;
    address?: ShipmentDraftConfig['receiverAddress'];
  };
  draft: ShipmentDraftConfig;
  expectedCod: number;
}): void {
  if (!params.sender.officeCode) {
    throw fieldError('senderOfficeCode', 'Липсва офис на подателя', 'Изберете офис на подателя.');
  }
  if (!params.sender.firstName || !params.sender.lastName) {
    throw fieldError('senderName', 'Липсва име на подателя', 'Попълнете име и фамилия на подателя.');
  }
  if (!isValidPhone(params.sender.phone)) {
    throw fieldError('senderPhone', 'Невалиден телефон на подателя', 'Проверете телефонния номер.');
  }
  if (!params.receiver.firstName || !params.receiver.lastName) {
    throw fieldError('receiverName', 'Липсва име на получателя', 'Попълнете име и фамилия на получателя.');
  }
  if (!isValidPhone(params.receiver.phone)) {
    throw fieldError('receiverPhone', 'Невалиден телефон', 'Проверете телефонния номер на получателя.');
  }
  if (!params.receiver.cityName) {
    throw fieldError('receiverCity', 'Липсва град на получателя', 'Изберете град.');
  }
  const weight = params.draft.weight;
  if (weight === undefined || weight === null || weight <= 0) {
    throw fieldError('weight', 'Липсва тегло', 'Въведете тегло на пратката в килограми.');
  }
  const count = params.draft.packageCount ?? 1;
  if (count < 1) {
    throw fieldError('packageCount', 'Невалиден брой пакети', 'Броят пакети трябва да е поне 1.');
  }
  if (params.receiver.deliveryType === 'office' && !params.receiver.officeCode && !params.draft.receiverOfficeCode) {
    throw fieldError(
      'receiverOfficeCode',
      'Липсва офис на получателя',
      'За доставка до офис изберете валиден офис на Еконт.'
    );
  }
  if (params.receiver.deliveryType === 'address') {
    const addr = params.draft.receiverAddress ?? params.receiver.address;
    if (!addr?.street || !addr?.num) {
      throw fieldError('receiverAddress', 'Непълен адрес', 'Попълнете улица и номер за адресна доставка.');
    }
  }
  const cod = params.draft.codOverrideAmount ?? params.expectedCod;
  if (cod < 0 || !Number.isFinite(cod)) {
    throw fieldError('codAmount', 'Невалиден наложен платеж', 'Въведете валидна сума в EUR.');
  }
  if (
    params.draft.codOverrideAmount !== undefined &&
    roundMoney(params.draft.codOverrideAmount) !== roundMoney(params.expectedCod) &&
    !params.draft.codOverrideConfirmed
  ) {
    throw fieldError(
      'codOverrideConfirmed',
      'Необходимо потвърждение',
      'Потвърдете промяната на наложения платеж.'
    );
  }
}

function fieldError(field: string, title: string, message: string): EcontAppError {
  return new EcontAppError({
    code: 'VALIDATION_FAILED',
    field,
    title,
    message,
    suggestion: message,
    retryable: false,
    httpStatus: 400,
  });
}
