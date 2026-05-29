'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '@/lib/translations';
import { useStoreSettings } from './StoreSettingsContext';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { settings } = useStoreSettings();
  
  // Fixed initial value so server and client markup match; hydrate prefs after mount
  const [language, setLanguageState] = useState<Language>('bg');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage === 'en' || savedLanguage === 'bg') {
      setLanguageState(savedLanguage);
    }
  }, []);

  // Sync with StoreSettings from DB (DB is source of truth)
  useEffect(() => {
    if (settings?.language) {
      setLanguageState(settings.language);
      localStorage.setItem('language', settings.language);
    }
  }, [settings?.language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

