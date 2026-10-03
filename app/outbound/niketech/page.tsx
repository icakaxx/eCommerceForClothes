'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { trackStoreEvent } from '@/lib/vercel-analytics';

export const NIKE_TECH_STORE_URL = 'https://www.niketech.eu/';

export default function NikeTechOutboundPage() {
  const { language } = useLanguage();

  useEffect(() => {
    trackStoreEvent('Nike Tech Click', {
      source: 'home-hero',
      destination: 'niketech.eu',
    });

    window.location.replace(NIKE_TECH_STORE_URL);
  }, []);

  return (
    <main className="min-h-[50vh] flex items-center justify-center px-4">
      <p className="text-sm text-[#6b6b6b] text-center">
        {language === 'bg'
          ? 'Пренасочване към NikeTech.eu…'
          : 'Redirecting to NikeTech.eu…'}
      </p>
    </main>
  );
}
