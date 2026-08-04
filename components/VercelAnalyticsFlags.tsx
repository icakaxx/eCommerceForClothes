'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useCookieConsent } from '@/context/CookieConsentContext';

const SCRIPT_ID = 'vercel-analytics-flag-values';

/**
 * Emits evaluated flag values to the DOM for Vercel Web Analytics.
 * @see https://vercel.com/docs/flags/observability/web-analytics
 */
export default function VercelAnalyticsFlags() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { consentStatus } = useCookieConsent();

  useEffect(() => {
    const values = {
      'store-language': language,
      'analytics-consent': consentStatus,
      'store-theme': theme.id,
    };

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.type = 'application/json';
      script.setAttribute('data-flag-values', '');
      document.body.appendChild(script);
    }

    script.textContent = JSON.stringify(values);
  }, [language, theme.id, consentStatus]);

  return null;
}
