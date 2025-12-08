'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProductType } from '@/lib/types/product-types';

interface ProductTypeContextType {
  productTypes: ProductType[];
  setProductTypes: React.Dispatch<React.SetStateAction<ProductType[]>>;
  loadProductTypes: () => Promise<void>;
  isLoading: boolean;
}

const ProductTypeContext = createContext<ProductTypeContextType | undefined>(undefined);

export function ProductTypeProvider({ children }: { children: ReactNode }) {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load product types from Supabase
  const loadProductTypes = async () => {
    try {
      setIsLoading(true);
      console.log('📦 Loading product types from Supabase...');

      const response = await fetch('/api/product-types');
      const result = await response.json();

      if (result.success && result.productTypes) {
        setProductTypes(result.productTypes);
        console.log(`✅ Loaded ${result.productTypes.length} product types from database`);
      } else {
        console.warn('⚠️ No product types found');
        setProductTypes([]);
      }
    } catch (error) {
      console.error('❌ Failed to load product types:', error);
      setProductTypes([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load product types on mount
  useEffect(() => {
    loadProductTypes();
  }, []);

  return (
    <ProductTypeContext.Provider value={{ productTypes, setProductTypes, loadProductTypes, isLoading }}>
      {children}
    </ProductTypeContext.Provider>
  );
}

export function useProductTypes() {
  const context = useContext(ProductTypeContext);
  if (context === undefined) {
    throw new Error('useProductTypes must be used within a ProductTypeProvider');
  }
  return context;
}

