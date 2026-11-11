'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import TrustBar from '@/components/home/TrustBar';
import { Product } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { isListedOnStorefront } from '@/lib/product-availability';
import type { HomepageHeroSlug } from '@/lib/homepage-hero';
import { getHeroCollectionCopy } from '@/lib/homepage-hero';

type HeroCuratedProductsProps = {
  slug: HomepageHeroSlug;
  productIds: string[];
};

export default function HeroCuratedProducts({ slug, productIds }: HeroCuratedProductsProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const copy = getHeroCollectionCopy(slug, language);

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [favoriteStatus, setFavoriteStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (productIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/products');
        const result = await response.json();
        if (cancelled || !result.success) {
          return;
        }

        const byId = new Map<string, Product>();
        for (const product of result.products || []) {
          const id = String(product.id || product.productid || '');
          if (id) byId.set(id, product);
        }

        const ordered = productIds
          .map((id) => byId.get(id))
          .filter((product): product is Product => Boolean(product))
          .filter((product) => isListedOnStorefront(product));

        setProducts(ordered);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [productIds.join(',')]);

  const productIdsString = useMemo(
    () =>
      products
        .map((p) => String(p.id || p.productid || ''))
        .filter(Boolean)
        .sort()
        .join(','),
    [products]
  );

  useEffect(() => {
    if (!isAuthenticated || !user || products.length === 0) {
      setFavoriteStatus({});
      return;
    }

    const checkFavorites = async () => {
      try {
        const ids = products
          .map((p) => String(p.id || p.productid || ''))
          .filter(Boolean);
        if (ids.length === 0) return;

        const response = await fetch('/api/favorites/check-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, productIds: ids }),
        });
        const data = await response.json();
        if (data.success && data.favorites) {
          setFavoriteStatus(data.favorites);
        }
      } catch {
      }
    };

    checkFavorites();
  }, [isAuthenticated, user, productIdsString, products.length]);

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: theme.colors.background }}
    >
      <TrustBar />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-8 sm:py-10">
        <div className="mb-8 sm:mb-10 text-center max-w-2xl mx-auto">
          <Link
            href="/"
            className="text-sm mb-3 inline-block hover:opacity-80 transition-opacity"
            style={{ color: theme.colors.textSecondary }}
          >
            {language === 'bg' ? '← Начало' : '← Home'}
          </Link>
          <h1
            className="font-serif-display text-2xl sm:text-3xl mb-2"
            style={{ color: theme.colors.text }}
          >
            {copy.title}
          </h1>
          <p className="text-sm sm:text-base" style={{ color: theme.colors.textSecondary }}>
            {copy.subtitle}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {Array.from({ length: Math.min(productIds.length || 4, 4) }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] rounded-2xl animate-pulse"
                style={{ backgroundColor: theme.colors.border }}
              />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {products.map((product) => {
              const productId = String(product.id || product.productid || '');
              return (
                <ProductCard
                  key={productId}
                  product={product}
                  isFavorited={favoriteStatus[productId] || false}
                />
              );
            })}
          </div>
        ) : (
          <div
            className="text-center py-16 px-6 rounded-2xl"
            style={{
              backgroundColor: theme.colors.secondary,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <p className="text-sm sm:text-base mb-6" style={{ color: theme.colors.textSecondary }}>
              {copy.empty}
            </p>
            <Link
              href="/products"
              className="inline-flex px-6 py-3 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: theme.colors.buttonPrimary }}
            >
              {language === 'bg' ? 'Виж всички артикули' : 'View all products'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
