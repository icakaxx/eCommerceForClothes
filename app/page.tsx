'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import Banner from '@/components/Banner';
import LoadingScreen from '@/components/LoadingScreen';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { translations } from '@/lib/translations';
import {
  ArrowRight,
  Headphones,
  Lock,
  RotateCcw,
  SlidersHorizontal,
  Truck,
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/lib/data';
import { useAuth } from '@/context/AuthContext';
import TestimonialsCarousel from '@/components/TestimonialsCarousel';

const MOBILE_INITIAL_VISIBLE = 4;
const DESKTOP_INITIAL_VISIBLE = 8;
const LOAD_MORE_STEP = 4;

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
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
        const filterVisible = (list: Product[]) =>
          list
            .filter((p: Product) => p.visible && (p.quantity > 0 || !p.variants || p.variants.length === 0))
            .slice(0, 12);

        let res = await fetch('/api/products?isfeatured=true&limit=24');
        let result = await res.json();
        let visible: Product[] = result.success ? filterVisible(result.products || []) : [];

        if (visible.length === 0) {
          res = await fetch('/api/products?limit=24');
          result = await res.json();
          if (result.success) {
            visible = filterVisible(result.products || []);
          }
        }
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
      if (!isAuthenticated || !user) {
        setLoadingFavorites(false);
        return;
      }

      try {
        setLoadingFavorites(true);
        const response = await fetch(`/api/favorites?userId=${user.id}`);
        const data = await response.json();

        if (data.success && data.productIds && data.productIds.length > 0) {
          const productsResponse = await fetch('/api/products');
          const productsData = await productsResponse.json();

          if (productsData.success && productsData.products) {
            const favorites = productsData.products
              .filter((p: Product) => data.productIds.includes(p.id || p.productid))
              .filter((p: Product) => p.visible && (p.quantity > 0 || !p.variants || p.variants.length === 0))
              .slice(0, 6);
            setFavoriteProducts(favorites);
          }
        }
      } catch (error) {
        console.error('Failed to load favorite products:', error);
      } finally {
        setLoadingFavorites(false);
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

  const heroImageUrl = settings?.heroimageurl;
  const heroFocusX = settings?.heroimagefocusx ?? 70;
  const heroFocusY = settings?.heroimagefocusy ?? 50;

  const trustItems = [
    {
      icon: Truck,
      title: language === 'bg' ? 'Бърза доставка' : 'Fast delivery',
      subtitle: language === 'bg' ? '1-2 работни дни' : '1-2 business days',
    },
    {
      icon: RotateCcw,
      title: language === 'bg' ? 'Лесно връщане' : 'Easy returns',
      subtitle: language === 'bg' ? '14 дни право на връщане' : '14-day return policy',
    },
    {
      icon: Lock,
      title: language === 'bg' ? 'Сигурно плащане' : 'Secure payment',
      subtitle: language === 'bg' ? '100% защитени плащания' : '100% protected payments',
    },
    {
      icon: Headphones,
      title: language === 'bg' ? 'Клиентска грижа' : 'Customer care',
      subtitle: language === 'bg' ? 'На разположение' : 'Always available',
    },
  ];

  const categoryPills = [
    { id: 'all', label: language === 'bg' ? 'Всички' : 'All', href: '/' },
    { id: 'for-him', label: language === 'bg' ? 'За него' : 'For Him', href: '/for-him' },
    { id: 'for-her', label: language === 'bg' ? 'За нея' : 'For Her', href: '/for-her' },
    { id: 'accessories', label: language === 'bg' ? 'Аксесоари' : 'Accessories', href: '/accessories' },
    { id: 'products', label: language === 'bg' ? 'Всички продукти' : 'All products', href: '/products' },
  ];

  const displayedProducts = featuredProducts.slice(0, visibleCount);
  const hasMoreProducts = visibleCount < featuredProducts.length;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.colors.background }}>
      <Banner />
      <Header isAdmin={isAdmin} setIsAdmin={handleSetIsAdmin} />

      <div className="flex-1 transition-colors duration-300">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-4 sm:pt-6 pb-2">
          <div
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl min-h-[320px] sm:min-h-[380px] lg:min-h-[420px]"
            style={{ backgroundColor: theme.colors.secondary }}
          >
            {heroImageUrl ? (
              heroImageUrl.toLowerCase().endsWith('.gif') ? (
                <img
                  src={heroImageUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ objectPosition: `${heroFocusX}% ${heroFocusY}%` }}
                />
              ) : (
                <Image
                  src={heroImageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 1280px"
                  className="object-cover"
                  style={{ objectPosition: `${heroFocusX}% ${heroFocusY}%` }}
                  priority
                />
              )
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.border} 100%)`,
                }}
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-r from-[#f9f7f2] via-[#f9f7f2]/90 to-transparent sm:from-[#f9f7f2]/95 sm:via-[#f9f7f2]/75 sm:to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent sm:hidden" />

            <div className="relative z-10 flex h-full min-h-[320px] sm:min-h-[380px] lg:min-h-[420px] items-end sm:items-center px-5 sm:px-8 lg:px-12 py-8 sm:py-10 max-w-xl">
              <div>
                <p
                  className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] mb-2 sm:mb-3"
                  style={{ color: theme.colors.primary }}
                >
                  {language === 'bg' ? 'Нова колекция' : 'New collection'}
                </p>
                <h1
                  className="font-serif-display text-3xl sm:text-4xl lg:text-5xl leading-[1.1] mb-3 sm:mb-4 text-white sm:text-[#1a1a1a]"
                >
                  {t.welcomeToStore || `Welcome to ${settings?.storename || 'Our Store'}`}
                </h1>
                <p
                  className="text-sm sm:text-base leading-relaxed mb-5 sm:mb-6 max-w-md text-white/90 sm:text-[#6b6b6b]"
                >
                  {t.homeDescription || 'Discover our latest collection of fashion and style'}
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-full font-medium text-sm sm:text-base transition-all duration-300 hover:opacity-90"
                  style={{
                    backgroundColor: theme.colors.buttonPrimary,
                    color: '#ffffff',
                  }}
                >
                  {t.shopNow || 'Shop Now'}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <section
          className="border-y"
          style={{
            backgroundColor: theme.colors.secondary,
            borderColor: theme.colors.border,
          }}
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-5">
            <div className="grid grid-cols-4 gap-2 sm:gap-6">
              {trustItems.map(item => (
                <div key={item.title} className="flex flex-col items-center text-center gap-1.5 sm:gap-2">
                  <item.icon
                    size={18}
                    className="sm:hidden"
                    style={{ color: theme.colors.text }}
                    strokeWidth={1.5}
                  />
                  <item.icon
                    size={22}
                    className="hidden sm:block"
                    style={{ color: theme.colors.text }}
                    strokeWidth={1.5}
                  />
                  <div>
                    <p
                      className="text-[10px] sm:text-sm font-medium leading-tight"
                      style={{ color: theme.colors.text }}
                    >
                      {item.title}
                    </p>
                    <p
                      className="hidden sm:block text-xs mt-0.5"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Category pills + filters */}
        <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-5 sm:pt-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
              <div className="flex items-center gap-2 min-w-max pb-1">
                {categoryPills.map(pill => {
                  const isActive = pill.id === 'all';
                  return (
                    <Link
                      key={pill.id}
                      href={pill.href}
                      className="px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors duration-200"
                      style={{
                        backgroundColor: isActive ? theme.colors.buttonPrimary : theme.colors.secondary,
                        color: isActive ? '#ffffff' : theme.colors.text,
                        border: isActive ? 'none' : `1px solid ${theme.colors.border}`,
                      }}
                    >
                      {pill.label}
                    </Link>
                  );
                })}
              </div>
            </div>

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

        {/* Product grid */}
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

        {/* Favorites */}
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

        {/* CTA */}
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
      </div>

      <Footer />
      <CartDrawer />
    </div>
  );
}
