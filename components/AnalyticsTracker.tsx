'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCookieConsent } from '@/context/CookieConsentContext';
import { collectVisitorData, isBot } from '@/lib/analytics';

export default function AnalyticsTracker() {
  const { hasConsent } = useCookieConsent();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [entryPage, setEntryPage] = useState<string>('');
  const sessionStartTime = useRef<number>(Date.now());
  const lastActivityTime = useRef<number>(Date.now());
  const pageViewCount = useRef<number>(0);
  const isTracking = useRef<boolean>(false);

  // Initialize session on mount
  useEffect(() => {
    if (!hasConsent || isBot()) {
      return;
    }

    // Check for existing session in sessionStorage
    const existingSession = sessionStorage.getItem('analytics_session_id');
    const sessionTimestamp = sessionStorage.getItem('analytics_session_timestamp');
    
    const now = Date.now();
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    // Check if session is still valid
    if (existingSession && sessionTimestamp) {
      const lastTime = parseInt(sessionTimestamp);
      if (now - lastTime < SESSION_TIMEOUT) {
        // Existing valid session
        setSessionId(existingSession);
        sessionStartTime.current = lastTime;
        const storedEntryPage = sessionStorage.getItem('analytics_entry_page');
        if (storedEntryPage) {
          setEntryPage(storedEntryPage);
        }
        const storedPageViews = sessionStorage.getItem('analytics_page_views');
        if (storedPageViews) {
          pageViewCount.current = parseInt(storedPageViews);
        }
        return;
      }
    }

    // Create new session
    initializeNewSession();
  }, [hasConsent]);

  // Track page views on route changes
  useEffect(() => {
    if (!hasConsent || !sessionId || isBot() || isTracking.current) {
      return;
    }

    const currentPage = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    
    // Skip admin pages
    if (pathname?.startsWith('/admin')) {
      return;
    }

    trackPageView(currentPage);
  }, [pathname, searchParams, hasConsent, sessionId]);

  // Update activity timestamp and handle page exit
  useEffect(() => {
    if (!hasConsent || !sessionId) {
      return;
    }

    const updateActivity = () => {
      lastActivityTime.current = Date.now();
      sessionStorage.setItem('analytics_session_timestamp', lastActivityTime.current.toString());
    };

    // Update activity on user interaction
    const events = ['click', 'scroll', 'keydown', 'mousemove'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Handle page exit to update exit page
    const handleBeforeUnload = () => {
      if (sessionId && pathname) {
        const currentPage = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
        updateExitPage(currentPage);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasConsent, sessionId, pathname, searchParams]);

  const initializeNewSession = async () => {
    const newSessionId = crypto.randomUUID();
    const currentPage = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    
    setSessionId(newSessionId);
    setEntryPage(currentPage);
    sessionStartTime.current = Date.now();
    lastActivityTime.current = Date.now();
    pageViewCount.current = 0;

    sessionStorage.setItem('analytics_session_id', newSessionId);
    sessionStorage.setItem('analytics_session_timestamp', sessionStartTime.current.toString());
    sessionStorage.setItem('analytics_entry_page', currentPage);
    sessionStorage.setItem('analytics_page_views', '0');

    // Send initial session data
    await sendTrackingData(newSessionId, currentPage, true);
  };

  const trackPageView = async (currentPage: string) => {
    if (!sessionId) return;

    pageViewCount.current += 1;
    sessionStorage.setItem('analytics_page_views', pageViewCount.current.toString());

    await sendTrackingData(sessionId, currentPage, false);
  };

  const sendTrackingData = async (sid: string, currentPage: string, isNew: boolean) => {
    if (isTracking.current) return;
    isTracking.current = true;

    try {
      const visitorData = await collectVisitorData();
      const sessionDuration = Math.floor((Date.now() - sessionStartTime.current) / 1000);

      const payload = {
        sessionId: sid,
        visitorId: visitorData.visitorId,
        deviceType: visitorData.deviceType,
        browser: visitorData.browser,
        browserVersion: visitorData.browserVersion,
        os: visitorData.os,
        osVersion: visitorData.osVersion,
        referrer: visitorData.referrer,
        referrerCategory: visitorData.referrerCategory,
        entryPage: entryPage || currentPage,
        exitPage: currentPage,
        pageViews: pageViewCount.current,
        sessionDuration,
        isBounce: pageViewCount.current <= 1,
        isNewSession: isNew,
      };

      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    } finally {
      isTracking.current = false;
    }
  };

  const updateExitPage = async (currentPage: string) => {
    if (!sessionId) return;

    try {
      const sessionDuration = Math.floor((Date.now() - sessionStartTime.current) / 1000);

      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          exitPage: currentPage,
          sessionDuration,
          pageViews: pageViewCount.current,
          isBounce: pageViewCount.current <= 1,
          isExit: true,
        }),
      });
    } catch (error) {
      console.error('Failed to update exit page:', error);
    }
  };

  // This component doesn't render anything
  return null;
}




