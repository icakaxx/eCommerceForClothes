/**
 * Vercel Web Analytics helpers (custom events + flag annotations).
 * @see https://vercel.com/docs/analytics/custom-events
 * @see https://vercel.com/docs/flags/observability/web-analytics
 */

export const VERCEL_ANALYTICS_FLAGS = [
  'store-language',
  'analytics-consent',
  'store-theme',
] as const;

export type VercelAnalyticsFlag = (typeof VERCEL_ANALYTICS_FLAGS)[number];

export type AnalyticsEventData = Record<string, string | number | boolean | null>;

const CONSENT_STORAGE_KEY = 'analytics_consent_status';

/** Vercel allows string | number | boolean | null only; keys/values max 255 chars. */
export function sanitizeAnalyticsData(
  data: AnalyticsEventData
): AnalyticsEventData {
  const out: AnalyticsEventData = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === null || typeof value === 'boolean' || typeof value === 'number') {
      out[key.slice(0, 255)] = value;
      continue;
    }
    if (typeof value === 'string') {
      out[key.slice(0, 255)] = value.slice(0, 255);
    }
  }
  return out;
}

export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CONSENT_STORAGE_KEY) === 'accepted';
}

/** Client-side custom event (storefront only; respects cookie consent). */
export function trackStoreEvent(
  name: string,
  data?: AnalyticsEventData
): void {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return;

  const eventName = name.slice(0, 255);
  const payload = sanitizeAnalyticsData(data ?? {});

  void import('@vercel/analytics')
    .then(({ track }) => {
      track(eventName, payload, {
        flags: [...VERCEL_ANALYTICS_FLAGS],
      });
    })
    .catch(() => {
      // Analytics optional — never break UX
    });
}

/** Server-side custom event (e.g. completed purchase). */
export async function trackServerEvent(
  name: string,
  data?: AnalyticsEventData
): Promise<void> {
  const eventName = name.slice(0, 255);
  const payload = sanitizeAnalyticsData(data ?? {});

  try {
    const { track } = await import('@vercel/analytics/server');
    await track(eventName, payload, {
      flags: [...VERCEL_ANALYTICS_FLAGS],
    });
  } catch {
    // Analytics optional on server
  }
}
