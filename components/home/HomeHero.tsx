'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { HOMEPAGE_HERO_PATHS } from '@/lib/homepage-hero';

const HERO_CARD_HEIGHT =
  'min-h-[300px] sm:min-h-[340px] lg:min-h-[360px]';

const HERO_CTA_CLASS =
  'inline-flex w-full sm:min-w-[15.75rem] sm:w-[15.75rem] items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium leading-none text-white whitespace-nowrap transition-opacity duration-300 hover:opacity-90';

type HeroCardContentProps = {
  variant: 'light' | 'dark';
  label: string;
  title: string;
  description: string;
  cta: ReactNode;
};

function HeroCardContent({ variant, label, title, description, cta }: HeroCardContentProps) {
  const isDark = variant === 'dark';

  return (
    <div
      className={`relative z-10 flex ${HERO_CARD_HEIGHT} flex-col px-5 sm:px-7 lg:px-8 py-7 sm:py-8 w-full sm:max-w-[88%]`}
    >
      <p
        className={`text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] mb-2 shrink-0 ${
          isDark ? 'text-white/70' : 'text-[#6b6b6b]'
        }`}
      >
        {label}
      </p>
      <h2
        className={`font-serif-display text-xl sm:text-2xl lg:text-[1.65rem] leading-snug mb-2 sm:mb-3 min-h-[3.25rem] lg:min-h-[4.5rem] shrink-0 ${
          isDark ? 'text-white' : 'text-[#1a1a1a]'
        }`}
      >
        {title}
      </h2>
      <p
        className={`text-sm sm:text-[0.9375rem] leading-relaxed mb-0 min-h-[2.75rem] lg:min-h-[3rem] flex-1 max-w-sm ${
          isDark ? 'text-white/80' : 'text-[#6b6b6b]'
        }`}
      >
        {description}
      </p>
      <div className="pt-5 sm:pt-6 shrink-0">{cta}</div>
    </div>
  );
}

const MODABOX_HERO_IMAGE = '/images/hero/hero-home.png';
const NIKE_TECH_HERO_IMAGE = '/images/hero/nike-tech-hoodie.avif';
const JACKETS_HERO_IMAGE =
  'https://undmzklwxotqunctdxyv.supabase.co/storage/v1/object/public/products/images/1793190309856-b4051o.webp';
const NIKE_TECH_TRACKING_HREF = '/outbound/niketech';

export type HomeHeroProduct = {
  id: string;
  name: string;
  image?: string | null;
};

type HomeHeroProps = {
  jacketsProduct?: HomeHeroProduct | null;
  formalProduct?: HomeHeroProduct | null;
  jacketsSelectionCount?: number;
  formalSelectionCount?: number;
};

export default function HomeHero({
  jacketsProduct,
  formalProduct,
  jacketsSelectionCount = 0,
  formalSelectionCount = 0,
}: HomeHeroProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isBg = language === 'bg';

  const jacketsHref = HOMEPAGE_HERO_PATHS.jackets;
  const jacketsImage = jacketsProduct?.image || JACKETS_HERO_IMAGE;
  const formalHref = HOMEPAGE_HERO_PATHS.formal;
  const formalImage = formalProduct?.image || MODABOX_HERO_IMAGE;

  const jacketsHasSelection = jacketsSelectionCount > 0;
  const formalHasSelection = formalSelectionCount > 0;

  const selectionLabel = (count: number) =>
    isBg
      ? count === 1
        ? '1 избран артикул'
        : `${count} избрани артикула`
      : count === 1
        ? '1 selected item'
        : `${count} selected items`;

  const copy = {
    overline: isBg ? 'Твоят стил, на едно място' : 'Your style, in one place',
    heading: isBg ? 'Какво търсиш?' : 'What are you looking for?',
    subtitle: isBg ? 'Избери своя стил' : 'Choose your style',
    modabox: {
      label: 'MODABOX',
      title: isBg ? 'Ризи, панталони и официално облекло' : 'Shirts, trousers and formal wear',
      description: formalHasSelection
        ? selectionLabel(formalSelectionCount)
        : isBg
          ? 'Стил за работа, събития и всеки ден.'
          : 'Style for work, events and everyday wear.',
      cta: isBg ? 'Виж подбраните артикули' : 'Shop the selection',
      imageAlt: formalProduct
        ? formalProduct.name
        : isBg
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
    jackets: {
      label: 'MODABOX',
      title: isBg ? 'Якета' : 'Jackets',
      description: jacketsHasSelection
        ? selectionLabel(jacketsSelectionCount)
        : isBg
          ? 'Двулицево Nike яке – лимитирана наличност.'
          : 'Reversible Nike jacket – limited availability.',
      cta: isBg ? 'Виж подбраните артикули' : 'Shop the selection',
      imageAlt: jacketsProduct
        ? jacketsProduct.name
        : isBg
          ? 'Двулицево Яке - Nike (ЛИМИТИРАНА НАЛИЧНОСТ)'
          : 'Reversible Nike jacket (limited stock)',
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 items-stretch">
        <Link
          href={formalHref}
          className={`relative order-3 lg:order-1 flex h-full overflow-hidden rounded-2xl sm:rounded-3xl ${HERO_CARD_HEIGHT} border transition-opacity duration-300 hover:opacity-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]`}
          style={{ borderColor: theme.colors.border, backgroundColor: '#f5f0e8' }}
        >
          <Image
            src={formalImage}
            alt={copy.modabox.imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-[72%_center]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f9f7f2]/95 via-[#f9f7f2]/75 to-[#f9f7f2]/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f9f7f2]/40 via-transparent to-transparent md:hidden" />

          <HeroCardContent
            variant="light"
            label={copy.modabox.label}
            title={copy.modabox.title}
            description={copy.modabox.description}
            cta={
              <span
                className={HERO_CTA_CLASS}
                style={{ backgroundColor: theme.colors.buttonPrimary || '#1a1a1a' }}
              >
                {copy.modabox.cta}
                <ArrowRight size={16} aria-hidden className="shrink-0" />
              </span>
            }
          />
        </Link>

        <article
          className={`relative order-2 lg:order-3 flex h-full overflow-hidden rounded-2xl sm:rounded-3xl ${HERO_CARD_HEIGHT} border border-[#2a2a2a]`}
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

          <HeroCardContent
            variant="dark"
            label={copy.nike.label}
            title={copy.nike.title}
            description={copy.nike.description}
            cta={
              <Link
                href={NIKE_TECH_TRACKING_HREF}
                className={`${HERO_CTA_CLASS} ring-1 ring-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
                style={{ backgroundColor: theme.colors.buttonPrimary || '#1a1a1a' }}
              >
                {copy.nike.cta}
                <ArrowRight size={16} aria-hidden className="shrink-0" />
              </Link>
            }
          />
        </article>

        <Link
          href={jacketsHref}
          className={`relative order-1 lg:order-2 flex h-full overflow-hidden rounded-2xl sm:rounded-3xl ${HERO_CARD_HEIGHT} border transition-opacity duration-300 hover:opacity-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]`}
          style={{ borderColor: theme.colors.border, backgroundColor: '#f5f0e8' }}
        >
          <Image
            src={jacketsImage}
            alt={copy.jackets.imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f9f7f2]/95 via-[#f9f7f2]/72 to-[#f9f7f2]/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f9f7f2]/45 via-transparent to-transparent md:hidden" />

          <HeroCardContent
            variant="light"
            label={copy.jackets.label}
            title={copy.jackets.title}
            description={copy.jackets.description}
            cta={
              <span
                className={HERO_CTA_CLASS}
                style={{ backgroundColor: theme.colors.buttonPrimary || '#1a1a1a' }}
              >
                {copy.jackets.cta}
                <ArrowRight size={16} aria-hidden className="shrink-0" />
              </span>
            }
          />
        </Link>
      </div>
    </section>
  );
}
