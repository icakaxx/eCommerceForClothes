'use client';

import { useState, useEffect, useCallback } from 'react';
import ProductMediaGallery from './ProductMediaGallery';
import ProductDetails from './ProductDetails';
import { Product } from '@/lib/data';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ProductViewProps {
  product: Product;
}

export default function ProductView({ product }: ProductViewProps) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = translations[language];
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [focusImage, setFocusImage] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDeliveryExpanded, setIsDeliveryExpanded] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const productImageUrls = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : Array.isArray(product.Images) && product.Images.length > 0
        ? product.Images.map((img: any) =>
            typeof img === 'string' ? img : (img.imageurl || img.ImageURL || img.url)
          ).filter(Boolean)
        : [];

    const nextGalleryImages = productImageUrls.length > 0 ? productImageUrls : ['/image.png'];

    const variants = product.variants || product.Variants || [];
    const primaryVariant = variants.find((v: any) => v.IsPrimaryImage && (v.images || v.imageurl || v.ImageURL));
    const firstVariant = variants[0];
    const initialVariantImage =
      primaryVariant?.imageurl ||
      primaryVariant?.ImageURL ||
      firstVariant?.imageurl ||
      firstVariant?.ImageURL ||
      (Array.isArray(primaryVariant?.images) && primaryVariant.images.length > 0 ? primaryVariant.images[0] : null) ||
      (Array.isArray(firstVariant?.images) && firstVariant.images.length > 0 ? firstVariant.images[0] : null) ||
      null;

    if (initialVariantImage && !nextGalleryImages.includes(initialVariantImage)) {
      setGalleryImages([initialVariantImage, ...nextGalleryImages]);
    } else {
      setGalleryImages(nextGalleryImages);
    }
    setFocusImage(initialVariantImage);
  }, [product.variants, product.Variants, product.images, product.Images]);

  useEffect(() => {
    // Fetch configured related products
    const fetchRelatedProducts = async () => {
      try {
        const productId = product.id || product.productid;
        const response = await fetch(`/api/products/${productId}/related`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.products) {
            setRelatedProducts(data.products);
          }
        }
      } catch (error) {
        console.error('Error fetching related products:', error);
      }
    };

    fetchRelatedProducts();
  }, [product.id, product.productid]);

  const handleVariantImageChange = useCallback((images: string[] | string | undefined) => {
    if (images) {
      // Handle both array and single string
      if (Array.isArray(images)) {
        const nextFocus = images.length > 0 ? images[0] : null;
        if (nextFocus) {
          setGalleryImages((prev) => (prev.includes(nextFocus) ? prev : [nextFocus, ...prev]));
        }
        setFocusImage(nextFocus);
      } else {
        setGalleryImages((prev) => (prev.includes(images) ? prev : [images, ...prev]));
        setFocusImage(images);
      }
    } else {
      setFocusImage(null);
    }
  }, []);

  return (
    <div 
      className="product__detail transition-colors duration-300"
      style={{ backgroundColor: theme.colors.background }}
    >
      <div className="product__page__middle max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-16">
          {/* Left column - Product Images */}
          <div className="product__detail__left">
            <ProductMediaGallery 
              images={galleryImages} 
              productName={`${product.brand} ${product.model}`}
              focusImage={focusImage}
            />
            
            {/* Expandable Product Description Section */}
            {product.description && (
              <div 
                className="mt-8 border rounded-lg overflow-hidden"
                style={{ borderColor: theme.colors.border }}
              >
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: theme.colors.surface }}
                >
                  <h2 
                    className="text-lg font-semibold"
                    style={{ color: theme.colors.text }}
                  >
                    {t.productDescriptionHeading}
                  </h2>
                  {isDescriptionExpanded ? (
                    <ChevronUp size={20} style={{ color: theme.colors.text }} />
                  ) : (
                    <ChevronDown size={20} style={{ color: theme.colors.text }} />
                  )}
                </button>
                {isDescriptionExpanded && (
                  <div 
                    className="px-6 py-4 border-t"
                    style={{ 
                      borderColor: theme.colors.border,
                      color: theme.colors.textSecondary 
                    }}
                  >
                    <p>{product.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Expandable Delivery Information Section */}
            <div 
              className="mt-4 border rounded-lg overflow-hidden"
              style={{ borderColor: theme.colors.border }}
            >
              <button
                onClick={() => setIsDeliveryExpanded(!isDeliveryExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:opacity-80 transition-opacity"
                style={{ backgroundColor: theme.colors.surface }}
              >
                <h2 
                  className="text-lg font-semibold"
                  style={{ color: theme.colors.text }}
                >
                  {t.deliveryInfo}
                </h2>
                {isDeliveryExpanded ? (
                  <ChevronUp size={20} style={{ color: theme.colors.text }} />
                ) : (
                  <ChevronDown size={20} style={{ color: theme.colors.text }} />
                )}
              </button>
              {isDeliveryExpanded && (
                <div 
                  className="px-6 py-4 border-t space-y-2"
                  style={{ 
                    borderColor: theme.colors.border,
                    color: theme.colors.textSecondary 
                  }}
                >
                  <p>{t.deliveryTime}</p>
                  <p>{t.deliveryMethods}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right column - Product Info */}
          <div className="product__detail__right">
            <ProductDetails
              product={product}
              onVariantChange={handleVariantImageChange}
            />
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-16 border-t" style={{ borderColor: theme.colors.border }}>
            <h2 
              className="text-2xl font-bold mb-8"
              style={{ color: theme.colors.text }}
            >
              {t.youMightLike}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => {
                const relatedPrice = relatedProduct.price ?? 0;
                const relatedPriceBgn = relatedPrice * 1.95;

                return (
                  <a
                    key={relatedProduct.id || relatedProduct.productid}
                    href={`/products/${relatedProduct.id || relatedProduct.productid}`}
                    className="group"
                  >
                    <div 
                      className="rounded-lg overflow-hidden mb-3 aspect-square"
                      style={{ backgroundColor: theme.colors.surface }}
                    >
                      <img
                        src={relatedProduct.images?.[0] || '/image.png'}
                        alt={`${relatedProduct.brand} ${relatedProduct.model}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h3 
                      className="font-semibold mb-1 group-hover:underline"
                      style={{ color: theme.colors.text }}
                    >
                      {relatedProduct.brand} {relatedProduct.model}
                    </h3>
                    <p 
                      className="text-lg font-bold"
                      style={{ color: theme.colors.primary }}
                    >
                      €{relatedPrice.toFixed(2)} / {relatedPriceBgn.toFixed(2)} лв
                    </p>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

