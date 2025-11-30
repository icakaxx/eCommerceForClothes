'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, initialProducts } from '@/lib/data';

interface ProductContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  loadProducts: () => Promise<void>;
  isLoading: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load products from Supabase
  const loadProducts = async () => {
    try {
      setIsLoading(true);
      console.log('📦 Loading products from Supabase...');

      const response = await fetch('/api/products');
      const result = await response.json();

      if (result.success && result.products) {
        setProducts(result.products);
        console.log(`✅ Loaded ${result.products.length} products from database`);
      } else {
        console.warn('⚠️ No products found, using initial products');
        setProducts(initialProducts);
      }
    } catch (error) {
      console.error('❌ Failed to load products:', error);
      // Fallback to initial products
      setProducts(initialProducts);
    } finally {
      setIsLoading(false);
    }
  };

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <ProductContext.Provider value={{ products, setProducts, loadProducts, isLoading }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}

