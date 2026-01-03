'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StorePage from '@/components/StorePage';
import CartDrawer from '@/components/CartDrawer';
import LoadingScreen from '@/components/LoadingScreen';
import { useProducts } from '@/context/ProductContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';

export default function ProductsPage() {
  const { products } = useProducts();
  const [isAdmin, setIsAdmin] = useState(false);
  const { isLoading: settingsLoading } = useStoreSettings();

  useEffect(() => {
    const adminState = localStorage.getItem('isAdmin');
    if (adminState === 'true') {
      setIsAdmin(true);
    }
  }, []);

  // Show loading screen while StoreSettings is loading (prevents showing backup content)
  if (settingsLoading) {
    return <LoadingScreen />;
  }

  const handleSetIsAdmin = (value: boolean) => {
    setIsAdmin(value);
    localStorage.setItem('isAdmin', value.toString());
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAdmin={isAdmin} setIsAdmin={handleSetIsAdmin} />
      <div className="flex-1">
        <StorePage products={products} currentPage="home" />
      </div>
      <Footer />
      <CartDrawer />
    </div>
  );
}








