'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StorePage from '@/components/StorePage';
import CartDrawer from '@/components/CartDrawer';
import LoadingScreen from '@/components/LoadingScreen';
import { Product } from '@/lib/data';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

export default function ForHimPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isLoading: settingsLoading, settings } = useStoreSettings();
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    const pageTitle = language === 'bg' ? 'За Него' : 'For Him';
    const storeName = settings?.storename || '';
    document.title = storeName ? `${pageTitle} - ${storeName}` : pageTitle;
  }, [language, settings?.storename]);

  useEffect(() => {
    const adminState = localStorage.getItem('isAdmin');
    if (adminState === 'true') {
      setIsAdmin(true);
    }
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products?rfproducttypeid=1');
        const result = await response.json();
        if (result.success) {
          setProducts(result.products);
        }
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleSetIsAdmin = (value: boolean) => {
    setIsAdmin(value);
    localStorage.setItem('isAdmin', value.toString());
  };

  // Show loading screen while StoreSettings is loading (prevents showing backup content)
  if (settingsLoading) {
    return <LoadingScreen />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header isAdmin={isAdmin} setIsAdmin={handleSetIsAdmin} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAdmin={isAdmin} setIsAdmin={handleSetIsAdmin} />
      <div className="flex-1">
        <StorePage products={products} currentPage="for-him" />
      </div>
      <Footer />
      <CartDrawer />
    </div>
  );
}







