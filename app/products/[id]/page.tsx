'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductView from '@/components/ProductView';
import CartDrawer from '@/components/CartDrawer';
import LoadingScreen from '@/components/LoadingScreen';
import { Product } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { translations } from '@/lib/translations';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const { isLoading: settingsLoading, settings } = useStoreSettings();
  const t = translations[language];
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const productName = product ? `${product.brand} ${product.model}` : '';
    const pageTitle = productName || (t.productDetails || (language === 'bg' ? 'Детайли на продукта' : 'Product Details'));
    const storeName = settings?.storename || '';
    document.title = storeName ? `${pageTitle} - ${storeName}` : pageTitle;
  }, [product, language, t, settings?.storename]);

  useEffect(() => {
    const adminState = localStorage.getItem('isAdmin');
    if (adminState === 'true') {
      setIsAdmin(true);
    }
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${params.id}`);
        if (!response.ok) {
          throw new Error('Product not found');
        }
        const data = await response.json();
        
        // API returns { success: true, product: {...} }
        if (data.success && data.product) {
          // Ensure images array exists and has at least one image
          const productData = {
            ...data.product,
            // Map Variants to variants for compatibility with ProductDetails component
            variants: data.product.Variants || data.product.variants || [],
            Variants: data.product.Variants || data.product.variants || [],
            images: data.product.images && data.product.images.length > 0
              ? data.product.images
              : data.product.Images && data.product.Images.length > 0
              ? data.product.Images.map((img: any) => img.imageurl || img.url)
              : ['/image.png'], // Fallback image
            brand: data.product.brand || 'Unknown',
            model: data.product.model || data.product.Name || 'Product',
            // Ensure propertyValues is properly mapped (API returns propertyvalues in lowercase)
            propertyValues: data.product.propertyValues || data.product.propertyvalues || {}
          };
          setProduct(productData);
        } else {
          throw new Error('Invalid product data');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id, router]);

  const handleSetIsAdmin = (value: boolean) => {
    setIsAdmin(value);
    localStorage.setItem('isAdmin', value.toString());
  };

  // Show loading screen while StoreSettings is loading (prevents showing backup content)
  if (settingsLoading) {
    return <LoadingScreen />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header isAdmin={isAdmin} setIsAdmin={handleSetIsAdmin} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t.loadingProduct}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAdmin={isAdmin} setIsAdmin={handleSetIsAdmin} />
      <div className="flex-1">
        <ProductView product={product} />
      </div>
      <Footer />
      <CartDrawer />
    </div>
  );
}

