'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, themes, defaultTheme } from '@/lib/themes';
import { useStoreSettings } from './StoreSettingsContext';

interface ThemeContextType {
  theme: Theme;
  setTheme: (themeId: string) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const { settings } = useStoreSettings();

  useEffect(() => {
    // First check if user has a saved theme preference
    const savedThemeId = localStorage.getItem('theme');
    if (savedThemeId) {
      const savedTheme = themes.find(t => t.id === savedThemeId);
      if (savedTheme) {
        setThemeState(savedTheme);
        applyTheme(savedTheme);
        return;
      }
    }

    // If no user preference, use store settings theme
    if (settings?.themeid) {
      const storeTheme = themes.find(t => t.id === settings.themeid);
      if (storeTheme) {
        setThemeState(storeTheme);
        applyTheme(storeTheme);
        return;
      }
    }

    // Fallback to default theme
    applyTheme(defaultTheme);
  }, [settings?.themeid]);

  const applyTheme = (selectedTheme: Theme) => {
    const root = document.documentElement;
    
    // Apply CSS variables
    root.style.setProperty('--theme-bg', selectedTheme.colors.background);
    root.style.setProperty('--theme-surface', selectedTheme.colors.surface);
    root.style.setProperty('--theme-text', selectedTheme.colors.text);
    root.style.setProperty('--theme-text-secondary', selectedTheme.colors.textSecondary);
    root.style.setProperty('--theme-primary', selectedTheme.colors.primary);
    root.style.setProperty('--theme-secondary', selectedTheme.colors.secondary);
    root.style.setProperty('--theme-accent', selectedTheme.colors.accent);
    root.style.setProperty('--theme-border', selectedTheme.colors.border);
    root.style.setProperty('--theme-header-bg', selectedTheme.colors.headerBg);
    root.style.setProperty('--theme-footer-bg', selectedTheme.colors.footerBg);
    root.style.setProperty('--theme-card-bg', selectedTheme.colors.cardBg);
    root.style.setProperty('--theme-button-primary', selectedTheme.colors.buttonPrimary);
    root.style.setProperty('--theme-button-primary-hover', selectedTheme.colors.buttonPrimaryHover);
    root.style.setProperty('--theme-button-secondary', selectedTheme.colors.buttonSecondary);
    root.style.setProperty('--theme-shadow', selectedTheme.effects.shadow);
    root.style.setProperty('--theme-shadow-hover', selectedTheme.effects.shadowHover);
    root.style.setProperty('--theme-radius', selectedTheme.effects.borderRadius);
    
    if (selectedTheme.effects.gradient) {
      root.style.setProperty('--theme-gradient', selectedTheme.effects.gradient);
    }

    // Apply background gradient if needed
    if (selectedTheme.id === 'gradient') {
      root.style.setProperty('--theme-bg', selectedTheme.colors.background);
    } else {
      root.style.setProperty('--theme-bg', selectedTheme.colors.background);
    }
  };

  const setTheme = (themeId: string) => {
    const selectedTheme = themes.find(t => t.id === themeId);
    if (selectedTheme) {
      setThemeState(selectedTheme);
      applyTheme(selectedTheme);
      localStorage.setItem('theme', themeId);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

