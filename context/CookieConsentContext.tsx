'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ConsentStatus = 'not-asked' | 'accepted' | 'rejected';

interface CookieConsentContextType {
  consentStatus: ConsentStatus;
  acceptConsent: () => void;
  rejectConsent: () => void;
  hasConsent: boolean;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

const CONSENT_COOKIE_NAME = 'analytics_consent';
const CONSENT_STORAGE_KEY = 'analytics_consent_status';

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>('not-asked');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Check localStorage for consent status
    const storedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (storedConsent === 'accepted' || storedConsent === 'rejected') {
      setConsentStatus(storedConsent as ConsentStatus);
    } else {
      // Check for cookie as fallback
      const cookieConsent = getCookie(CONSENT_COOKIE_NAME);
      if (cookieConsent === 'accepted' || cookieConsent === 'rejected') {
        setConsentStatus(cookieConsent as ConsentStatus);
        // Sync to localStorage
        localStorage.setItem(CONSENT_STORAGE_KEY, cookieConsent);
      }
    }
  }, []);

  const acceptConsent = () => {
    setConsentStatus('accepted');
    localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted');
    setCookie(CONSENT_COOKIE_NAME, 'accepted', 365); // 1 year expiry
  };

  const rejectConsent = () => {
    setConsentStatus('rejected');
    localStorage.setItem(CONSENT_STORAGE_KEY, 'rejected');
    // Don't set cookie if rejected, but store in sessionStorage to not ask again this session
    sessionStorage.setItem('consent_asked_this_session', 'true');
  };

  const hasConsent = consentStatus === 'accepted';

  if (!isClient) {
    // Return default values during SSR
    return (
      <CookieConsentContext.Provider value={{ 
        consentStatus: 'not-asked', 
        acceptConsent: () => {}, 
        rejectConsent: () => {}, 
        hasConsent: false 
      }}>
        {children}
      </CookieConsentContext.Provider>
    );
  }

  return (
    <CookieConsentContext.Provider value={{ consentStatus, acceptConsent, rejectConsent, hasConsent }}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
}

// Helper functions
function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}




