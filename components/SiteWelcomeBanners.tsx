'use client';

import { useEffect, useState } from 'react';
import { useCookieConsent } from '@/context/CookieConsentContext';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

export default function SiteWelcomeBanners() {
  const { consentStatus, acceptConsent, rejectConsent } = useCookieConsent();
  const { language } = useLanguage();
  const t = translations[language || 'en'];

  const [isVisible, setIsVisible] = useState(false);
  const [askedThisSession, setAskedThisSession] = useState(false);

  const showCookieBanner = consentStatus === 'not-asked' && !askedThisSession;

  useEffect(() => {
    const sessionAsked = sessionStorage.getItem('consent_asked_this_session');

    if (consentStatus === 'rejected' && sessionAsked) {
      setAskedThisSession(true);
    }

    if (consentStatus === 'not-asked' && !sessionAsked) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }

    setIsVisible(false);
  }, [consentStatus]);

  const handleAccept = () => {
    acceptConsent();
    setIsVisible(false);
  };

  const handleReject = () => {
    rejectConsent();
    setAskedThisSession(true);
    setIsVisible(false);
  };

  if (!showCookieBanner || !isVisible) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
        onClick={handleReject}
      />

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-500 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-white dark:bg-gray-800 shadow-2xl border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  🍪 {t.cookieConsentTitle}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 max-w-3xl">
                  {t.cookieConsentMessage}
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleReject}
                  className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
                >
                  {t.cookieConsentReject}
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  {t.cookieConsentAccept}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
