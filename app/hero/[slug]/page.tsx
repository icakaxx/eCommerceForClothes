'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PublicPageLayout from '@/components/PublicPageLayout';
import LoadingScreen from '@/components/LoadingScreen';
import HeroCuratedProducts from '@/components/home/HeroCuratedProducts';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  getHeroCollectionCopy,
  isHomepageHeroSlug,
  resolveHeroProductIds,
} from '@/lib/homepage-hero';

export default function HeroCollectionPage() {
  const params = useParams();
  const slugParam = typeof params.slug === 'string' ? params.slug : '';
  const slug = isHomepageHeroSlug(slugParam) ? slugParam : null;

  const [isAdmin, setIsAdmin] = useState(false);
  const { settings, isLoading: settingsLoading } = useStoreSettings();
  const { language } = useLanguage();

  useEffect(() => {
    const adminState = localStorage.getItem('isAdmin');
    if (adminState === 'true') setIsAdmin(true);
  }, []);

  useEffect(() => {
    if (!slug) return;
    const copy = getHeroCollectionCopy(slug, language);
    const storeName = settings?.storename || '';
    document.title = storeName ? `${copy.title} - ${storeName}` : copy.title;
  }, [slug, language, settings?.storename]);

  const handleSetIsAdmin = (value: boolean) => {
    setIsAdmin(value);
    localStorage.setItem('isAdmin', value.toString());
  };

  if (settingsLoading) {
    return <LoadingScreen />;
  }

  if (!slug) {
    return (
      <PublicPageLayout isAdmin={isAdmin} setIsAdmin={handleSetIsAdmin}>
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-sm text-gray-600">
          {language === 'bg' ? 'Страницата не е намерена.' : 'Page not found.'}
        </div>
      </PublicPageLayout>
    );
  }

  const productIds = resolveHeroProductIds(settings, slug);

  return (
    <PublicPageLayout isAdmin={isAdmin} setIsAdmin={handleSetIsAdmin}>
      <HeroCuratedProducts slug={slug} productIds={productIds} />
    </PublicPageLayout>
  );
}
