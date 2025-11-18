'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { Language } from '@/lib/translations';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const { theme } = useTheme();

  return (
    <div 
      className="flex items-center gap-2 rounded-full p-1 transition-colors duration-300"
      style={{ backgroundColor: theme.colors.secondary }}
    >
      <button
        onClick={() => setLanguage('bg')}
        className="px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-300"
        style={{
          backgroundColor: language === 'bg' ? theme.colors.primary : 'transparent',
          color: language === 'bg' ? '#ffffff' : theme.colors.textSecondary,
          boxShadow: language === 'bg' ? theme.effects.shadow : 'none'
        }}
        onMouseEnter={(e) => {
          if (language !== 'bg') {
            e.currentTarget.style.color = theme.colors.text;
          }
        }}
        onMouseLeave={(e) => {
          if (language !== 'bg') {
            e.currentTarget.style.color = theme.colors.textSecondary;
          }
        }}
      >
        BG
      </button>
      <button
        onClick={() => setLanguage('en')}
        className="px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-300"
        style={{
          backgroundColor: language === 'en' ? theme.colors.primary : 'transparent',
          color: language === 'en' ? '#ffffff' : theme.colors.textSecondary,
          boxShadow: language === 'en' ? theme.effects.shadow : 'none'
        }}
        onMouseEnter={(e) => {
          if (language !== 'en') {
            e.currentTarget.style.color = theme.colors.text;
          }
        }}
        onMouseLeave={(e) => {
          if (language !== 'en') {
            e.currentTarget.style.color = theme.colors.textSecondary;
          }
        }}
      >
        EN
      </button>
    </div>
  );
}

