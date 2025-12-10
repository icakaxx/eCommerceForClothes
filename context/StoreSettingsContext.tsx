'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface StoreSettings {
  storesettingsid: string;
  storename: string;
  logourl: string | null;
  themeid: string;
  language: 'en' | 'bg';
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
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error loading store settings:', error);
        setError('Failed to load store settings');
        return;
      }

      if (data) {
        setSettings(data);
      } else {
        // Create default settings if none exist
        const defaultSettings = {
          storename: 'ModaBox',
          logourl: null,
          themeid: 'default',
          language: 'en' as const
        };

        const { data: newSettings, error: insertError } = await supabase
          .from('store_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (insertError) {
          console.error('Error creating default store settings:', insertError);
          setError('Failed to create default settings');
          return;
        }

        setSettings(newSettings);
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
