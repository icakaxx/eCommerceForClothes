'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, initialProducts } from '@/lib/data';

interface ProductContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  // Load products from localStorage on mount
  useEffect(() => {
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch (e) {
        console.error('Failed to load products from localStorage', e);
      }
    }
  }, []);

  // Save products to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  return (
    <ProductContext.Provider value={{ products, setProducts }}>
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

