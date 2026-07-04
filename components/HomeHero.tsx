'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { translations } from '@/lib/translations';

const HERO_IMAGE = '/hero-home.png';

export default function HomeHero() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const t = translations[language];

  const newCollectionLabel = language === 'bg' ? 'Нова колекция' : 'New collection';
  const heroAlt =
    language === 'bg'
      ? 'Добре дошли в нашия магазин – нова колекция дрехи, обувки и аксесоари'
      : 'Welcome to our store – new collection of clothes, shoes and accessories';

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-4 sm:pt-6 pb-2">
      <div
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl min-h-[340px] sm:min-h-[400px] lg:min-h-[440px]"
        style={{ backgroundColor: theme.colors.secondary }}
      >
        <Image
          src={HERO_IMAGE}
          alt={heroAlt}
          fill
          sizes="(max-width: 768px) 100vw, 1280px"
          className="object-cover"
          style={{ objectPosition: '75% center' }}
          priority
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#f9f7f2] via-[#f9f7f2]/92 to-transparent sm:from-[#f9f7f2] sm:via-[#f9f7f2]/80 sm:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent sm:hidden" />

        <div className="relative z-10 flex h-full min-h-[340px] sm:min-h-[400px] lg:min-h-[440px] items-end sm:items-center px-5 sm:px-8 lg:px-12 py-8 sm:py-10 max-w-xl">
          <div>
            <p
              className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] mb-2 sm:mb-3"
              style={{ color: theme.colors.primary }}
            >
              {newCollectionLabel}
            </p>
            <h1 className="font-serif-display text-[1.75rem] sm:text-4xl lg:text-5xl leading-[1.12] mb-3 sm:mb-4 text-white sm:text-[#1a1a1a]">
              {t.welcomeToStore || 'Добре дошли в нашия магазин'}
            </h1>
            <p className="text-sm sm:text-base leading-relaxed mb-5 sm:mb-6 max-w-md text-white/90 sm:text-[#6b6b6b]">
              {t.homeDescription ||
                'Открийте нашата най-нова колекция от дрехи, обувки и аксесоари'}
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-full font-medium text-sm sm:text-base transition-all duration-300 hover:opacity-90"
              style={{
                backgroundColor: theme.colors.buttonPrimary,
                color: '#ffffff',
              }}
            >
              {t.shopNow || 'Пазарувайте сега'}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
