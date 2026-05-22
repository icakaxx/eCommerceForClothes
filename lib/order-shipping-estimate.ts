import type { Language } from '@/lib/translations';

const SOFIA_TZ = 'Europe/Sofia';
const SAME_DAY_CUTOFF_HOUR = 13;

export interface ShippingEstimate {
  /** Order placed before 13:00 Sofia time */
  shipsSameDay: boolean;
  shipDateLabel: string;
  expectedDeliveryLabel: string;
}

function getSofiaDateParts(isoDate: string): { year: number; month: number; day: number; hour: number } {
  const date = new Date(isoDate);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: SOFIA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const read = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0);
  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
  };
}

function addCalendarDays(year: number, month: number, day: number, days: number) {
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

function formatCalendarDate(year: number, month: number, day: number, language: Language): string {
  const utc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return utc.toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Econt-style estimate: orders before 13:00 Sofia ship same day; after 13:00 ship next day.
 * Typical delivery is 1 business day after dispatch.
 */
export function getShippingEstimate(orderDateIso: string, language: Language): ShippingEstimate {
  const { year, month, day, hour } = getSofiaDateParts(orderDateIso);
  const shipsSameDay = hour < SAME_DAY_CUTOFF_HOUR;

  const shipParts = shipsSameDay
    ? { year, month, day }
    : addCalendarDays(year, month, day, 1);

  const deliveryParts = addCalendarDays(shipParts.year, shipParts.month, shipParts.day, 1);

  return {
    shipsSameDay,
    shipDateLabel: formatCalendarDate(shipParts.year, shipParts.month, shipParts.day, language),
    expectedDeliveryLabel: formatCalendarDate(
      deliveryParts.year,
      deliveryParts.month,
      deliveryParts.day,
      language
    ),
  };
}

export function getShippingEstimateMessage(orderDateIso: string, language: Language): string {
  const estimate = getShippingEstimate(orderDateIso, language);

  if (language === 'bg') {
    if (estimate.shipsSameDay) {
      return `Поръчката ви ще бъде изпратена днес (${estimate.shipDateLabel}), тъй като е направена преди 13:00 ч. Очаквана доставка: ${estimate.expectedDeliveryLabel} (обикновено 1 работен ден).`;
    }
    return `Поръчката ви ще бъде изпратена на ${estimate.shipDateLabel} (след 13:00 ч. изпращаме на следващия ден). Очаквана доставка: ${estimate.expectedDeliveryLabel} (обикновено 1 работен ден).`;
  }

  if (estimate.shipsSameDay) {
    return `Your order will be dispatched today (${estimate.shipDateLabel}) because it was placed before 13:00. Expected delivery: ${estimate.expectedDeliveryLabel} (typically 1 business day).`;
  }
  return `Your order will be dispatched on ${estimate.shipDateLabel} (orders after 13:00 ship the next day). Expected delivery: ${estimate.expectedDeliveryLabel} (typically 1 business day).`;
}
