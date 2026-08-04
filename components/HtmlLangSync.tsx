'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function HtmlLangSync() {
  const { language } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language === 'en' ? 'en' : 'bg';
  }, [language]);

  return null;
}
