'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LoadingScreen from '@/components/LoadingScreen';
import PublicPageLayout from '@/components/PublicPageLayout';
import HomeHero from '@/components/HomeHero';
import TrustBar from '@/components/TrustBar';
import CategoryPillsNav from '@/components/CategoryPillsNav';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { translations } from '@/lib/translations';
import { ArrowRight, SlidersHorizontal } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/lib/data';
import { useAuth } from '@/context/AuthContext';
import TestimonialsCarousel from '@/components/TestimonialsCarousel';
import { isListedOnStorefront } from '@/lib/product-availability';

const MOBILE_INITIAL_VISIBLE = 4;
const DESKTOP_INITIAL_VISIBLE = 8;
const LOAD_MORE_STEP = 4;

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [featuredFavorites, setFeaturedFavorites] = useState<Record<string, boolean>>({});
  const [testimonials, setTestimonials] = useState<Array<{
    testimonialid: string;
    imageurl: string;
    sortorder: number;
    isactive: boolean;
  }>>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [visibleCount, setVisibleCount] = useState(MOBILE_INITIAL_VISIBLE);
  const { settings, isLoading: settingsLoading } = useStoreSettings();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const t = translations[language];

  useEffect(() => {
    const pageTitle = t.home || (language === 'bg' ? 'Начало' : 'Home');
    const storeName = settings?.storename || '';
    document.title = storeName ? `${pageTitle} - ${storeName}` : pageTitle;
  }, [language, t, settings?.storename]);

  useEffect(() => {
    const adminState = localStorage.getItem('isAdmin');
    if (adminState === 'true') {
      setIsAdmin(true);
    }
  }, []);

  useEffect(() => {
    const updateVisibleCount = () => {
      setVisibleCount(
        window.innerWidth >= 768 ? DESKTOP_INITIAL_VISIBLE : MOBILE_INITIAL_VISIBLE
      );
    };

    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);

  useEffect(() => {
    const loadHomeProducts = async () => {
      try {
        setLoadingFeatured(true);
        // Homepage shows the full storefront catalog (same pool as /products),
        // not only items marked isfeatured.
        const res = await fetch('/api/products');
        const result = await res.json();
        const visible: Product[] = result.success
          ? (result.products || []).filter((p: Product) => isListedOnStorefront(p))
          : [];
        setFeaturedProducts(visible);
      } catch (error) {
        console.error('Failed to load home products:', error);
      } finally {
        setLoadingFeatured(false);
      }
    };

    loadHomeProducts();
  }, []);

  useEffect(() => {
    const loadFavoriteProducts = async () => {
      if (!isAuthenticated || !user) return;

      try {
        const response = await fetch(`/api/favorites?userId=${user.id}`);
        const data = await response.json();

        if (data.success && data.productIds && data.productIds.length > 0) {
          const productsResponse = await fetch('/api/products');
          const productsData = await productsResponse.json();

          if (productsData.success && productsData.products) {
            const favorites = productsData.products
              .filter((p: Product) => data.productIds.includes(p.id || p.productid))
              .filter((p: Product) => isListedOnStorefront(p))
              .slice(0, 6);
            setFavoriteProducts(favorites);
          }
        }
      } catch (error) {
        console.error('Failed to load favorite products:', error);
      }
    };

    loadFavoriteProducts();
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user && featuredProducts.length > 0) {
      const checkFeaturedFavorites = async () => {
        try {
          const productIds = featuredProducts
            .map(p => String(p.id || p.productid || ''))
            .filter(id => id !== '');

          if (productIds.length === 0) return;

          const response = await fetch('/api/favorites/check-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              productIds: productIds
            })
          });

          const data = await response.json();
          if (data.success && data.favorites) {
            setFeaturedFavorites(data.favorites);
          }
        } catch (error) {
          console.error('Error checking featured favorites:', error);
        }
      };

      checkFeaturedFavorites();
    } else {
      setFeaturedFavorites({});
    }
  }, [isAuthenticated, user, featuredProducts.map(p => p.id || p.productid).join(',')]);

  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        setLoadingTestimonials(true);
        const response = await fetch('/api/testimonials');
        const result = await response.json();
        if (result.success) {
          setTestimonials(result.testimonials || []);
        }
      } catch (error) {
        console.error('Failed to load testimonials:', error);
      } finally {
        setLoadingTestimonials(false);
      }
    };

    loadTestimonials();
  }, []);

  if (settingsLoading) {
    return <LoadingScreen />;
  }

  const handleSetIsAdmin = (value: boolean) => {
    setIsAdmin(value);
    localStorage.setItem('isAdmin', value.toString());
  };

  const displayedProducts = featuredProducts.slice(0, visibleCount);
  const hasMoreProducts = visibleCount < featuredProducts.length;

  return (
    <PublicPageLayout isAdmin={isAdmin} setIsAdmin={handleSetIsAdmin}>
      <HomeHero />
      <TrustBar />

      <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-5 sm:pt-6">
        <div className="flex items-center gap-3">
          <CategoryPillsNav />
          <Link
            href="/products"
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shrink-0 transition-colors duration-200"
            style={{
              backgroundColor: theme.colors.secondary,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <SlidersHorizontal size={16} />
            {language === 'bg' ? 'Филтри' : 'Filters'}
          </Link>
        </div>

        <Link
          href="/products"
          className="md:hidden flex items-center justify-center gap-2 w-full mt-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200"
          style={{
            backgroundColor: theme.colors.secondary,
            color: theme.colors.text,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <SlidersHorizontal size={16} />
          {language === 'bg' ? 'Филтри' : 'Filters'}
        </Link>
      </section>

      <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-5 sm:pt-6 pb-8 sm:pb-10">
        {loadingFeatured ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] rounded-2xl animate-pulse"
                style={{ backgroundColor: theme.colors.border }}
              />
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
              {displayedProducts.map((product) => {
                const productId = String(product.id || product.productid || '');
                return (
                  <ProductCard
                    key={product.id || product.productid}
                    product={product}
                    isFavorited={featuredFavorites[productId] || false}
                  />
                );
              })}
            </div>

            {hasMoreProducts && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount(prev =>
                      Math.min(prev + LOAD_MORE_STEP, featuredProducts.length)
                    )
                  }
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-medium transition-colors duration-200"
                  style={{
                    backgroundColor: theme.colors.secondary,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  {language === 'bg' ? 'Вижте повече продукти' : 'See more products'}
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center py-12 text-sm" style={{ color: theme.colors.textSecondary }}>
            {language === 'bg' ? 'Няма налични артикули за показване.' : 'No products to show yet.'}
          </p>
        )}
      </section>

      {isAuthenticated && user && favoriteProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-10 sm:py-12">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h2
              className="text-xl sm:text-2xl font-serif-display transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {t.myFavorites || (language === 'bg' ? 'Моите любими' : 'My Favorites')}
            </h2>
            <Link
              href="/user/dashboard?tab=favorites"
              className="text-sm font-medium underline hover:opacity-80 transition-opacity"
              style={{ color: theme.colors.primary }}
            >
              {language === 'bg' ? 'Виж всички' : 'View all'}
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {favoriteProducts.map((product) => (
              <ProductCard
                key={product.id || product.productid}
                product={product}
                isFavorited={true}
              />
            ))}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pb-12 sm:pb-16">
        <div
          className="text-center p-8 sm:p-12 rounded-2xl sm:rounded-3xl"
          style={{
            backgroundColor: theme.colors.secondary,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <h2
            className="font-serif-display text-2xl sm:text-3xl mb-3 transition-colors duration-300"
            style={{ color: theme.colors.text }}
          >
            {t.readyToShop || 'Ready to Start Shopping?'}
          </h2>
          <p
            className="text-sm sm:text-base mb-6 max-w-lg mx-auto transition-colors duration-300"
            style={{ color: theme.colors.textSecondary }}
          >
            {t.readyToShopDesc || 'Explore our products and find your perfect style'}
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-medium transition-all duration-300 hover:opacity-90"
            style={{
              backgroundColor: theme.colors.buttonPrimary,
              color: '#ffffff',
            }}
          >
            {t.viewProducts || 'View Products'}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {settings?.closingremarks && (
        <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pb-12 sm:pb-16">
          <div
            className="text-center p-8 sm:p-10 rounded-2xl"
            style={{
              backgroundColor: theme.colors.secondary,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <div
              className="text-sm sm:text-base leading-relaxed whitespace-pre-line transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {settings.closingremarks}
            </div>
          </div>
        </section>
      )}

      {!loadingTestimonials && testimonials.length > 0 && (
        <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pb-12 sm:pb-16">
          <h2
            className="font-serif-display text-2xl sm:text-3xl mb-6 sm:mb-8 text-center transition-colors duration-300"
            style={{ color: theme.colors.text }}
          >
            {language === 'bg' ? 'Отзиви от клиенти' : 'Customer Testimonials'}
          </h2>
          <TestimonialsCarousel testimonials={testimonials} />
        </section>
      )}
    </PublicPageLayout>
  );
}
