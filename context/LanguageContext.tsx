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
  
  // Initialize state from localStorage synchronously to prevent flash
  // Default to 'bg' to match DB configuration (DB is source of truth)
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language;
      if (savedLanguage === 'en' || savedLanguage === 'bg') {
        return savedLanguage;
      }
    }
    // Default to 'bg' since DB is configured to Bulgarian (prevents English flash)
    return 'bg';
  });

  // Sync with StoreSettings from DB (DB is source of truth)
  useEffect(() => {
    if (settings?.language && settings.language !== language) {
      setLanguageState(settings.language);
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', settings.language);
      }
    }
  }, [settings?.language, language]);

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

