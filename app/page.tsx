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
import { ShoppingBag, Sparkles, Heart } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/lib/data';
import { useAuth } from '@/context/AuthContext';
import TestimonialsCarousel from '@/components/TestimonialsCarousel';

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

  // Load favorite products if user is authenticated
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
          // Fetch full product details
          const productsResponse = await fetch('/api/products');
          const productsData = await productsResponse.json();

          if (productsData.success && productsData.products) {
            const favorites = productsData.products
              .filter((p: Product) => data.productIds.includes(p.id || p.productid))
              .filter((p: Product) => p.visible && (p.quantity > 0 || !p.variants || p.variants.length === 0))
              .slice(0, 6); // Limit to 6 products
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

  // Batch check favorites for featured products
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

  // Load testimonials
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

  // Show loading screen while StoreSettings is loading (prevents showing backup content)
  if (settingsLoading) {
    return <LoadingScreen />;
  }

  const handleSetIsAdmin = (value: boolean) => {
    setIsAdmin(value);
    localStorage.setItem('isAdmin', value.toString());
  };

  const isGradientTheme = theme.id === 'gradient';

  return (
    <div className="min-h-screen flex flex-col">
      <Banner />
      <Header isAdmin={isAdmin} setIsAdmin={handleSetIsAdmin} />
      <div 
        className="flex-1 transition-colors duration-300"
        style={{ 
          background: isGradientTheme ? theme.colors.background : theme.colors.background
        }}
      >
        {/* Product cards first — no hero above */}
        <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1
                className="text-2xl sm:text-3xl lg:text-4xl font-bold transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {t.welcomeToStore || `Welcome to ${settings?.storename || 'Our Store'}`}
              </h1>
              <p
                className="mt-2 text-sm sm:text-base max-w-2xl transition-colors duration-300"
                style={{ color: theme.colors.textSecondary }}
              >
                {t.homeDescription || 'Discover our latest collection of fashion and style'}
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center justify-center shrink-0 px-5 py-3 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 hover:scale-[1.02] min-h-[44px]"
              style={{
                backgroundColor: theme.colors.primary,
                color: '#ffffff',
                boxShadow: theme.effects.shadowHover,
              }}
            >
              {t.shopNow || 'Shop Now'}
            </Link>
          </div>

          {loadingFeatured ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] rounded-xl animate-pulse"
                  style={{ backgroundColor: theme.colors.border }}
                />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map((product) => {
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
          ) : (
            <p className="text-center py-12 text-sm" style={{ color: theme.colors.textSecondary }}>
              {language === 'bg' ? 'Няма налични артикули за показване.' : 'No products to show yet.'}
            </p>
          )}
        </section>

        {/* Favorites Section — directly under main grid when present */}
        {isAuthenticated && user && favoriteProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-10 sm:py-12">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h2 
                className="text-2xl sm:text-3xl font-bold transition-colors duration-300"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div 
              className="text-center p-6 sm:p-8 rounded-lg transition-all duration-300"
              style={{
                backgroundColor: theme.colors.cardBg,
                border: `1px solid ${theme.colors.border}`
              }}
            >
              <ShoppingBag 
                size={48} 
                className="mx-auto mb-4"
                style={{ color: theme.colors.primary }}
              />
              <h3 
                className="text-xl font-semibold mb-2 transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {t.wideSelection || 'Wide Selection'}
              </h3>
              <p 
                className="text-sm sm:text-base transition-colors duration-300"
                style={{ color: theme.colors.textSecondary }}
              >
                {t.wideSelectionDesc || 'Browse through our extensive collection of quality products'}
              </p>
            </div>

            <div 
              className="text-center p-6 sm:p-8 rounded-lg transition-all duration-300"
              style={{
                backgroundColor: theme.colors.cardBg,
                border: `1px solid ${theme.colors.border}`
              }}
            >
              <Sparkles 
                size={48} 
                className="mx-auto mb-4"
                style={{ color: theme.colors.primary }}
              />
              <h3 
                className="text-xl font-semibold mb-2 transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {t.qualityAssured || 'Quality Assured'}
              </h3>
              <p 
                className="text-sm sm:text-base transition-colors duration-300"
                style={{ color: theme.colors.textSecondary }}
              >
                {t.qualityAssuredDesc || 'Every product is carefully selected for quality and style'}
              </p>
            </div>

            <div 
              className="text-center p-6 sm:p-8 rounded-lg transition-all duration-300"
              style={{
                backgroundColor: theme.colors.cardBg,
                border: `1px solid ${theme.colors.border}`
              }}
            >
              <Heart 
                size={48} 
                className="mx-auto mb-4"
                style={{ color: theme.colors.primary }}
              />
              <h3 
                className="text-xl font-semibold mb-2 transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {t.customerFirst || 'Customer First'}
              </h3>
              <p 
                className="text-sm sm:text-base transition-colors duration-300"
                style={{ color: theme.colors.textSecondary }}
              >
                {t.customerFirstDesc || 'Your satisfaction is our top priority'}
              </p>
            </div>
          </div>
        </section>

        {/* Optional campaign image — below products and features */}
        {settings?.heroimageurl ? (
        <section className="relative w-full">
          {(() => {
            const focusX = settings?.heroimagefocusx ?? 50;
            const focusY = settings?.heroimagefocusy ?? 50;
            const mobilePosition = `center ${focusY}%`;
            const desktopPosition = `${focusX}% center`;

            return (
              <div className="relative w-full h-[280px] sm:h-[360px] lg:h-[440px] overflow-hidden">
                {settings.heroimageurl.toLowerCase().endsWith('.gif') ? (
                  <>
                    <img
                      src={settings.heroimageurl}
                      alt=""
                      className="w-full h-full object-cover hero-image-mobile"
                      style={{
                        objectPosition: mobilePosition,
                      }}
                    />
                    <style jsx>{`
                      @media (min-width: 768px) {
                        .hero-image-mobile {
                          object-position: ${desktopPosition} !important;
                        }
                      }
                    `}</style>
                  </>
                ) : (
                  <>
                    <Image
                      src={settings.heroimageurl}
                      alt=""
                      fill
                      sizes="100vw"
                      className="object-cover animate-zoom-in hero-image-mobile"
                      style={{
                        objectPosition: mobilePosition,
                      }}
                    />
                    <style jsx>{`
                      @media (min-width: 768px) {
                        .hero-image-mobile {
                          object-position: ${desktopPosition} !important;
                        }
                      }
                    `}</style>
                  </>
                )}
                <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                  <div className="text-center px-3 sm:px-4 lg:px-8 max-w-4xl mx-auto">
                    <p
                      className="text-lg sm:text-xl lg:text-2xl text-white drop-shadow-md transition-colors duration-300"
                    >
                      {t.homeDescription || 'Discover our latest collection of fashion and style'}
                    </p>
                    <Link
                      href="/products"
                      className="inline-block mt-6 px-6 py-3 rounded-lg font-semibold text-base transition-all duration-300 hover:scale-105"
                      style={{
                        backgroundColor: theme.colors.primary,
                        color: '#ffffff',
                        boxShadow: theme.effects.shadowHover,
                      }}
                    >
                      {t.shopNow || 'Shop Now'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>
        ) : null}

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-12 sm:py-16">
          <div 
            className="text-center p-8 sm:p-12 rounded-lg"
            style={{
              backgroundColor: theme.colors.cardBg,
              border: `1px solid ${theme.colors.border}`
            }}
          >
            <h2 
              className="text-2xl sm:text-3xl font-bold mb-4 transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {t.readyToShop || 'Ready to Start Shopping?'}
            </h2>
            <p 
              className="text-base sm:text-lg mb-6 transition-colors duration-300"
              style={{ color: theme.colors.textSecondary }}
            >
              {t.readyToShopDesc || 'Explore our products and find your perfect style'}
            </p>
            <Link
              href="/products"
              className="inline-block px-8 py-4 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: theme.colors.primary,
                color: '#ffffff',
                boxShadow: theme.effects.shadowHover
              }}
            >
              {t.viewProducts || 'View Products'}
            </Link>
          </div>
        </section>

        {/* Closing Remarks Section */}
        {settings?.closingremarks && (
          <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-12 sm:py-16">
            <div 
              className="text-center p-8 sm:p-12 rounded-lg"
              style={{
                backgroundColor: theme.colors.cardBg,
                border: `1px solid ${theme.colors.border}`
              }}
            >
              <div 
                className="text-base sm:text-lg leading-relaxed whitespace-pre-line transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {settings.closingremarks}
              </div>
            </div>
          </section>
        )}

        {/* Testimonials Section */}
        {!loadingTestimonials && testimonials.length > 0 && (
          <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-12 sm:py-16">
            <h2 
              className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center transition-colors duration-300"
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
