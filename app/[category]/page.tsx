'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StorePage from '@/components/StorePage';
import { useProducts } from '@/context/ProductContext';
import { useProductTypes } from '@/context/ProductTypeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { translations } from '@/lib/translations';

export default function CategoryPage() {
  const { category } = useParams();
  const { products } = useProducts();
  const { productTypes } = useProductTypes();
  const [isAdmin, setIsAdmin] = useState(false);
  const { language } = useLanguage();
  const { settings } = useStoreSettings();
  const t = translations[language];

  useEffect(() => {
    const productType = productTypes.find(type =>
      type.producttypeid === category || type.code === category
    );
    const pageTitle = productType?.name || t.products || (language === 'bg' ? 'Артикули' : 'Items');
    const storeName = settings?.storename || '';
    document.title = storeName ? `${pageTitle} - ${storeName}` : pageTitle;
  }, [category, productTypes, language, t, settings?.storename]);

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

  // Find the product type by code or ID
  const productType = productTypes.find(type =>
    type.code.toLowerCase() === category ||
    type.producttypeid === category
  );

  // If it's a valid product type, show the category page
  if (productType) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header isAdmin={isAdmin} setIsAdmin={handleSetIsAdmin} />
        <div className="flex-1">
          <StorePage products={products} currentPage={productType.producttypeid} />
        </div>
        <Footer />
      </div>
    );
  }

  // If category is not found, redirect to home or show 404
  return (
    <div className="min-h-screen flex flex-col">
      <Header isAdmin={isAdmin} setIsAdmin={handleSetIsAdmin} />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
          <p>The category "{category}" does not exist.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}



