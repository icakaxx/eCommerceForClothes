'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StorePage from '@/components/StorePage';
import { useProducts } from '@/context/ProductContext';
import { useProductTypes } from '@/context/ProductTypeContext';

export default function CategoryPage() {
  const { category } = useParams();
  const { products } = useProducts();
  const { productTypes } = useProductTypes();
  const [isAdmin, setIsAdmin] = useState(false);

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
    type.Code.toLowerCase() === category ||
    type.ProductTypeID === category
  );

  // If it's a valid product type, show the category page
  if (productType) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header isAdmin={isAdmin} setIsAdmin={handleSetIsAdmin} />
        <div className="flex-1">
          <StorePage products={products} currentPage={productType.ProductTypeID} />
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



