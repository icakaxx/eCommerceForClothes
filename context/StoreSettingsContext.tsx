'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface StoreSettings {
  storesettingsid: string;
  storename: string;
  logourl: string | null;
  themeid: string;
  language: 'en' | 'bg';
  bannertext: string | null;
  bannerduration: number | null;
  heroimageurl: string | null;
  discordurl: string | null;
  facebookurl: string | null;
  pinteresturl: string | null;
  youtubeurl: string | null;
  instagramurl: string | null;
  xurl: string | null;
  tiktokurl: string | null;
  email: string | null;
  yearofcreation: number | null;
  telephonenumber: string | null;
  closingremarks: string | null;
  aboutusphoto: string | null;
  aboutustext: string | null;
  createdat: string;
  updatedat: string;
}

interface StoreSettingsContextType {
  settings: StoreSettings | null;
  isLoading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setError(null);

      // Fetch settings via API route
      const response = await fetch('/api/store-settings');
      const result = await response.json();

      if (!response.ok) {
        console.error('Error loading store settings:', result.error);
        setError('Failed to load store settings');
        return;
      }

      if (result.settings) {
        setSettings(result.settings);
      } else {
        // Create default settings if none exist
        const defaultSettings = {
          storename: 'ModaBox',
          logourl: null,
          themeid: 'default',
          language: 'en'
        };

        const createResponse = await fetch('/api/store-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(defaultSettings)
        });

        const createResult = await createResponse.json();

        if (!createResponse.ok || !createResult.success) {
          console.error('Error creating default store settings:', createResult.error);
          setError('Failed to create default settings');
          return;
        }

        setSettings(createResult.settings);
      }
    } catch (err) {
      console.error('Error loading store settings:', err);
      setError('Failed to load store settings');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <StoreSettingsContext.Provider value={{ settings, isLoading, error, refreshSettings }}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  const context = useContext(StoreSettingsContext);
  if (context === undefined) {
    throw new Error('useStoreSettings must be used within a StoreSettingsProvider');
  }
  return context;
}
