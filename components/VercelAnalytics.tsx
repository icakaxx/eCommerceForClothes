'use client';

import { Analytics } from '@vercel/analytics/next';
import { useCookieConsent } from '@/context/CookieConsentContext';

/** Loads Vercel Web Analytics only after the shopper accepts cookies. */
export default function VercelAnalytics() {
  const { hasConsent } = useCookieConsent();

  if (!hasConsent) {
    return null;
  }

  return <Analytics />;
}
