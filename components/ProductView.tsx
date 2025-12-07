'use client';

import { useState, useEffect, useCallback } from 'react';
import ProductMediaGallery from './ProductMediaGallery';
import ProductDetails from './ProductDetails';
import { Product } from '@/lib/data';
import { useTheme } from '@/context/ThemeContext';

interface ProductViewProps {
  product: Product;
}

export default function ProductView({ product }: ProductViewProps) {
  const { theme } = useTheme();
  const [currentImages, setCurrentImages] = useState<string[]>([]);

  useEffect(() => {
    // Get initial images - primary variant image or general product images
    const primaryVariant = product.variants?.find((v: any) => v.IsPrimaryImage && v.ImageURL);

    if (primaryVariant?.ImageURL) {
      // Use primary variant image
      setCurrentImages([primaryVariant.ImageURL]);
    } else if (product.variants?.[0]?.ImageURL) {
      // Use first variant's image
      setCurrentImages([product.variants[0].ImageURL]);
    } else if (product.images && product.images.length > 0) {
      // Fallback to general product images
      setCurrentImages(product.images);
    } else {
      // Fallback to placeholder
      setCurrentImages(['/image.png']);
    }
  }, [product.variants, product.images]); // Fixed dependencies

  const handleVariantImageChange = useCallback((imageUrl: string | undefined) => {
    if (imageUrl) {
      setCurrentImages([imageUrl]);
    }
  }, []); // Stable callback

  return (
    <div 
      className="product__detail transition-colors duration-300"
      style={{ backgroundColor: theme.colors.background }}
    >
      <div className="product__page__middle max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Two-column layout inspired by evershop */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-16">
          {/* Left column - Product Images */}
          <div className="product__detail__left">
            <ProductMediaGallery 
              images={currentImages} 
              productName={`${product.brand} ${product.model}`}
            />
          </div>

          {/* Right column - Product Info */}
          <div className="product__detail__right">
            <ProductDetails 
              product={product} 
              onVariantChange={handleVariantImageChange}
            />
          </div>
        </div>

        {/* Product Description Section */}
        {product.description && (
          <div 
            className="mt-12 pt-12 border-t"
            style={{ borderColor: theme.colors.border }}
          >
            <h2 
              className="text-2xl font-bold mb-4"
              style={{ color: theme.colors.text }}
            >
              Product Description
            </h2>
            <div 
              className="prose max-w-none"
              style={{ color: theme.colors.textSecondary }}
            >
              <p>{product.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

