'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProductType } from '@/lib/types/product-types';

interface ProductTypeContextType {
  productTypes: ProductType[];
  setProductTypes: React.Dispatch<React.SetStateAction<ProductType[]>>;
  loadProductTypes: () => Promise<void>;
  isLoading: boolean;
  // Hierarchy helper functions
  getLeafCategories: () => ProductType[];
  getChildren: (parentId: string) => ProductType[];
  getParent: (categoryId: string) => ProductType | undefined;
  getCategoryPath: (categoryId: string) => ProductType[];
  isLeafCategory: (categoryId: string) => boolean;
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

  // Get leaf categories (categories with no children)
  const getLeafCategories = (): ProductType[] => {
    return productTypes.filter(pt => pt.isLeaf !== false && (!pt.children || pt.children.length === 0));
  };

  // Get children of a parent category
  const getChildren = (parentId: string): ProductType[] => {
    return productTypes.filter(pt => pt.parent_producttypeid === parentId);
  };

  // Get parent of a category
  const getParent = (categoryId: string): ProductType | undefined => {
    const category = productTypes.find(pt => pt.producttypeid === categoryId);
    if (!category || !category.parent_producttypeid) return undefined;
    return productTypes.find(pt => pt.producttypeid === category.parent_producttypeid);
  };

  // Get full category path from root to category
  const getCategoryPath = (categoryId: string): ProductType[] => {
    const path: ProductType[] = [];
    let current: ProductType | undefined = productTypes.find(pt => pt.producttypeid === categoryId);
    
    while (current) {
      path.unshift(current);
      if (current.parent_producttypeid) {
        current = productTypes.find(pt => pt.producttypeid === current!.parent_producttypeid);
      } else {
        break;
      }
    }
    
    return path;
  };

  // Check if a category is a leaf (has no children)
  const isLeafCategory = (categoryId: string): boolean => {
    const category = productTypes.find(pt => pt.producttypeid === categoryId);
    if (!category) return false;
    if (category.isLeaf !== undefined) return category.isLeaf;
    return !productTypes.some(pt => pt.parent_producttypeid === categoryId);
  };

  // Load product types on mount
  useEffect(() => {
    loadProductTypes();
  }, []);

  return (
    <ProductTypeContext.Provider value={{ 
      productTypes, 
      setProductTypes, 
      loadProductTypes, 
      isLoading,
      getLeafCategories,
      getChildren,
      getParent,
      getCategoryPath,
      isLeafCategory
    }}>
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



