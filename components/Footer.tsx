'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { translations } from '@/lib/translations';

export default function Footer() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { settings } = useStoreSettings();
  const pathname = usePathname();
  const t = translations[language];

  const navItems = [
    { id: 'home', label: t.home, path: '/' },
    { id: 'products', label: t.products, path: '/products' },
    { id: 'about', label: t.about, path: '/about' }
  ];

  return (
    <footer 
      className="border-t mt-8 sm:mt-16 transition-colors duration-300"
      style={{ 
        backgroundColor: theme.colors.footerBg,
        borderColor: theme.colors.border
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        {/* Navigation Links */}
        <nav className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-6">
          {navItems.map(item => (
            <Link
              key={item.id}
              href={item.path}
              className="text-xs sm:text-sm font-medium transition-colors duration-300 hover:opacity-70"
              style={{
                color: pathname === item.path
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Store Info */}
        <div 
          className="text-center text-xs sm:text-sm transition-colors duration-300"
          style={{ color: theme.colors.textSecondary }}
        >
          <div
            className="font-medium mb-1 transition-colors duration-300"
            style={{ color: theme.colors.text }}
          >
            {settings?.storename || 'Store'}
          </div>
          <div className="break-words">{t.copyright} · {t.contact}</div>
        </div>
      </div>
    </footer>
  );
}

