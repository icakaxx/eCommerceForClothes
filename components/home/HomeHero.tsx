'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

const MODABOX_HERO_IMAGE = '/images/hero/hero-home.png';
const NIKE_TECH_HERO_IMAGE = '/images/hero/nike-tech-hoodie.avif';
const MODABOX_CATALOG_HREF = '/products';
const NIKE_TECH_TRACKING_HREF = '/outbound/niketech';

export default function HomeHero() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isBg = language === 'bg';

  const copy = {
    overline: isBg ? 'Твоят стил, на едно място' : 'Your style, in one place',
    heading: isBg ? 'Какво търсиш?' : 'What are you looking for?',
    subtitle: isBg ? 'Избери своя стил' : 'Choose your style',
    modabox: {
      label: 'MODABOX',
      title: isBg ? 'Ризи, панталони и официално облекло' : 'Shirts, trousers and formal wear',
      description: isBg
        ? 'Стил за работа, събития и всеки ден.'
        : 'Style for work, events and everyday wear.',
      cta: isBg ? 'Разгледай MODABOX' : 'Browse MODABOX',
      imageAlt: isBg
        ? 'MODABOX – ризи, панталони и официално облекло'
        : 'MODABOX – shirts, trousers and formal wear',
    },
    nike: {
      label: 'NIKE TECH',
      title: isBg ? 'Търсиш Nike Tech?' : 'Looking for Nike Tech?',
      description: isBg ? 'Tech Fleece екипи и актуални модели.' : 'Tech Fleece sets and latest models.',
      cta: isBg ? 'Към NikeTech екипите' : 'Go to NikeTech.eu',
      imageAlt: isBg ? 'Nike Tech – Tech Fleece и streetwear' : 'Nike Tech – Tech Fleece and streetwear',
    },
  };

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-4 sm:pt-6 pb-2">
      <div className="text-center mb-6 sm:mb-8 px-1">
        <p
          className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.22em] mb-2 sm:mb-3"
          style={{ color: theme.colors.textSecondary }}
        >
          {copy.overline}
        </p>
        <h1 className="font-serif-display text-3xl sm:text-4xl lg:text-[2.75rem] leading-tight text-[#1a1a1a] mb-2 sm:mb-3">
          {copy.heading}
        </h1>
        <p className="text-sm sm:text-base" style={{ color: theme.colors.textSecondary }}>
          {copy.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
        <article
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl min-h-[300px] sm:min-h-[340px] lg:min-h-[360px] border"
          style={{ borderColor: theme.colors.border, backgroundColor: '#f5f0e8' }}
        >
          <Image
            src={MODABOX_HERO_IMAGE}
            alt={copy.modabox.imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-[72%_center]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f9f7f2]/95 via-[#f9f7f2]/75 to-[#f9f7f2]/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f9f7f2]/40 via-transparent to-transparent md:hidden" />

          <div className="relative z-10 flex h-full min-h-[300px] sm:min-h-[340px] lg:min-h-[360px] flex-col justify-end sm:justify-center px-5 sm:px-7 lg:px-8 py-7 sm:py-8 max-w-[92%] sm:max-w-[85%]">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] mb-2 text-[#6b6b6b]">
              {copy.modabox.label}
            </p>
            <h2 className="font-serif-display text-xl sm:text-2xl lg:text-[1.65rem] leading-snug text-[#1a1a1a] mb-2 sm:mb-3">
              {copy.modabox.title}
            </h2>
            <p className="text-sm sm:text-[0.9375rem] leading-relaxed text-[#6b6b6b] mb-5 sm:mb-6 max-w-sm">
              {copy.modabox.description}
            </p>
            <Link
              href={MODABOX_CATALOG_HREF}
              className="inline-flex w-fit items-center gap-2 rounded-full px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-white transition-opacity duration-300 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
              style={{ backgroundColor: theme.colors.buttonPrimary || '#1a1a1a' }}
            >
              {copy.modabox.cta}
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </article>

        <article
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl min-h-[300px] sm:min-h-[340px] lg:min-h-[360px] border border-[#2a2a2a]"
          style={{ backgroundColor: '#0f0f0f' }}
        >
          <Image
            src={NIKE_TECH_HERO_IMAGE}
            alt={copy.nike.imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent md:hidden" />

          <div className="relative z-10 flex h-full min-h-[300px] sm:min-h-[340px] lg:min-h-[360px] flex-col justify-end sm:justify-center px-5 sm:px-7 lg:px-8 py-7 sm:py-8 max-w-[92%] sm:max-w-[85%]">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] mb-2 text-white/70">
              {copy.nike.label}
            </p>
            <h2 className="font-serif-display text-xl sm:text-2xl lg:text-[1.65rem] leading-snug text-white mb-2 sm:mb-3">
              {copy.nike.title}
            </h2>
            <p className="text-sm sm:text-[0.9375rem] leading-relaxed text-white/80 mb-5 sm:mb-6 max-w-sm">
              {copy.nike.description}
            </p>
            <Link
              href={NIKE_TECH_TRACKING_HREF}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-[#1a1a1a] transition-opacity duration-300 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {copy.nike.cta}
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
