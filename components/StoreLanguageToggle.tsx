'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import type { Language } from '@/lib/translations';

function BulgariaFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 3 2" className={className} aria-hidden="true">
      <rect fill="#ffffff" width="3" height="2" />
      <rect fill="#00966E" y="0.666" width="3" height="0.666" />
      <rect fill="#D62612" y="1.333" width="3" height="0.666" />
    </svg>
  );
}

export default function StoreLanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const { theme } = useTheme();

  const buttonBase =
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 touch-manipulation';

  const setLang = (lang: Language) => {
    if (language !== lang) setLanguage(lang);
  };

  return (
    <div
      className="flex items-center gap-0.5 rounded-full p-0.5"
      style={{
        backgroundColor: theme.colors.secondary,
        border: `1px solid ${theme.colors.border}`,
      }}
      role="group"
      aria-label={language === 'bg' ? 'Избор на език' : 'Language selection'}
    >
      <button
        type="button"
        onClick={() => setLang('bg')}
        className={buttonBase}
        style={{
          backgroundColor: language === 'bg' ? theme.colors.primary : 'transparent',
          color: language === 'bg' ? '#ffffff' : theme.colors.textSecondary,
        }}
        aria-pressed={language === 'bg'}
        aria-label="Български"
      >
        <BulgariaFlag className="h-3 w-4 rounded-[1px] shadow-sm" />
        <span>BG</span>
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={buttonBase}
        style={{
          backgroundColor: language === 'en' ? theme.colors.primary : 'transparent',
          color: language === 'en' ? '#ffffff' : theme.colors.textSecondary,
        }}
        aria-pressed={language === 'en'}
        aria-label="English"
      >
        <span className="text-[10px] font-bold tracking-wide opacity-90">EN</span>
      </button>
    </div>
  );
}
