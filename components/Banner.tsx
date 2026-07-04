'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Truck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';

export default function Banner() {
  const { settings } = useStoreSettings();
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  const bannerLines = settings?.bannertext
    ? settings.bannertext
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
    : [];

  const duration = settings?.bannerduration || 5;
  const defaultText =
    language === 'bg'
      ? 'Безплатна доставка за поръчки над 149 евро.'
      : 'Free delivery for orders over 149 EUR';

  useEffect(() => {
    if (bannerLines.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % bannerLines.length);
    }, duration * 1000);

    return () => clearInterval(interval);
  }, [bannerLines.length, duration]);

  const displayText =
    bannerLines.length > 0 ? bannerLines[currentIndex] : defaultText;

  const topLinks = [
    {
      href: '/about',
      label: language === 'bg' ? 'За нас' : 'About us',
    },
    {
      href: '/about',
      label: language === 'bg' ? 'Помощ' : 'Help',
    },
    {
      href: '/about',
      label: language === 'bg' ? 'Контакти' : 'Contacts',
    },
  ];

  return (
    <div
      className="w-full border-b transition-colors duration-300"
      style={{
        backgroundColor: 'var(--modabox-beige)',
        borderColor: 'var(--modabox-border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2 flex items-center justify-between gap-4">
        <div
          className="flex items-center gap-2 min-w-0 text-xs sm:text-sm"
          style={{ color: 'var(--modabox-dark)' }}
        >
          <Truck size={14} className="shrink-0" style={{ color: 'var(--modabox-olive)' }} />
          <p className="font-medium truncate transition-all duration-500 ease-in-out">
            {displayText}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-5 shrink-0">
          {topLinks.map(link => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs sm:text-sm transition-opacity hover:opacity-70"
              style={{ color: 'var(--modabox-muted)' }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
