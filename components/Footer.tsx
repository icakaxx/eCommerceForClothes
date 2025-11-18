'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { translations } from '@/lib/translations';

export default function Footer() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const t = translations[language];

  return (
    <footer 
      className="border-t mt-8 sm:mt-16 transition-colors duration-300"
      style={{ 
        backgroundColor: theme.colors.footerBg,
        borderColor: theme.colors.border
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        <div 
          className="text-center text-xs sm:text-sm transition-colors duration-300"
          style={{ color: theme.colors.textSecondary }}
        >
          <div 
            className="font-medium mb-1 transition-colors duration-300"
            style={{ color: theme.colors.text }}
          >
            ModaBox
          </div>
          <div className="break-words">{t.copyright} · {t.contact}</div>
        </div>
      </div>
    </footer>
  );
}

