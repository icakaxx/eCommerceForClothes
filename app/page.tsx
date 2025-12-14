'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { translations } from '@/lib/translations';
import { ShoppingBag, Sparkles, Heart } from 'lucide-react';

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { settings } = useStoreSettings();
  const t = translations[language];

  useEffect(() => {
    const adminState = localStorage.getItem('isAdmin');
    if (adminState === 'true') {
      setIsAdmin(true);
    }
  }, []);

  const handleSetIsAdmin = (value: boolean) => {
    setIsAdmin(value);
    localStorage.setItem('isAdmin', value.toString());
  };

  const isGradientTheme = theme.id === 'gradient';

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAdmin={isAdmin} setIsAdmin={handleSetIsAdmin} />
      <div 
        className="flex-1 transition-colors duration-300"
        style={{ 
          background: isGradientTheme ? theme.colors.background : theme.colors.background
        }}
      >
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-12 sm:py-16 lg:py-24">
          <div className="text-center">
            <h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {t.welcomeToStore || `Welcome to ${settings?.storename || 'Our Store'}`}
            </h1>
            <p 
              className="text-lg sm:text-xl lg:text-2xl mb-8 sm:mb-12 max-w-3xl mx-auto transition-colors duration-300"
              style={{ color: theme.colors.textSecondary }}
            >
              {t.homeDescription || 'Discover our latest collection of fashion and style'}
            </p>
            <Link
              href="/products"
              className="inline-block px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: theme.colors.primary,
                color: '#ffffff',
                boxShadow: theme.effects.shadowHover
              }}
            >
              {t.shopNow || 'Shop Now'}
            </Link>
          </div>
        </section>

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
      </div>
      <Footer />
      <CartDrawer />
    </div>
  );
}
