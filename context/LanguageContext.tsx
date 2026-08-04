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
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    const userChoseLanguage = localStorage.getItem('language-user-preference') === 'true';

    if (userChoseLanguage && (savedLanguage === 'en' || savedLanguage === 'bg')) {
      setLanguageState(savedLanguage);
    } else if (settings?.language === 'en' || settings?.language === 'bg') {
      setLanguageState(settings.language);
      localStorage.setItem('language', settings.language);
    } else if (savedLanguage === 'en' || savedLanguage === 'bg') {
      setLanguageState(savedLanguage);
    }

    setHasHydrated(true);
  }, [settings?.language]);

  // Store default from DB only before the shopper picks a language
  useEffect(() => {
    if (!hasHydrated) return;
    if (localStorage.getItem('language-user-preference') === 'true') return;
    if (settings?.language === 'en' || settings?.language === 'bg') {
      setLanguageState(settings.language);
      localStorage.setItem('language', settings.language);
    }
  }, [settings?.language, hasHydrated]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    localStorage.setItem('language-user-preference', 'true');
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

