'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const DEFAULT_LANGUAGE: Language = 'bg';

function isLanguage(value: string | null | undefined): value is Language {
  return value === 'en' || value === 'bg';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const userChoseLanguage = localStorage.getItem('language-user-preference') === 'true';
    const savedLanguage = localStorage.getItem('language');

    if (userChoseLanguage && isLanguage(savedLanguage)) {
      setLanguageState(savedLanguage);
      return;
    }

    setLanguageState(DEFAULT_LANGUAGE);
    localStorage.setItem('language', DEFAULT_LANGUAGE);
  }, []);

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
