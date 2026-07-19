'use client';

import { useState, useEffect, useCallback } from 'react';
import ProductMediaGallery from './ProductMediaGallery';
import ProductDetails from './ProductDetails';
import ProductCard from './ProductCard';
import { Product } from '@/lib/data';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { normalizeProductImages } from '@/lib/product-images';

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
  const [maybeYouWillLikeProducts, setMaybeYouWillLikeProducts] = useState<Product[]>([]);

  useEffect(() => {
    const rawProductImages = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : Array.isArray(product.Images) && product.Images.length > 0
        ? product.Images.map((img: any) =>
            typeof img === 'string' ? img : (img.imageurl || img.ImageURL || img.url)
          ).filter(Boolean)
        : [];

    // Prefer product photos (up to 4). Fall back to a variant image only if none exist.
    let nextGalleryImages = normalizeProductImages(rawProductImages, '');
    if (nextGalleryImages.length === 1 && nextGalleryImages[0] === '') {
      nextGalleryImages = [];
    }

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

    if (nextGalleryImages.length === 0 && initialVariantImage) {
      nextGalleryImages = [initialVariantImage];
    }

    setGalleryImages(nextGalleryImages);
    setFocusImage(initialVariantImage || nextGalleryImages[0] || null);
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

  // Fetch and prioritize "Maybe you will like" products
  useEffect(() => {
    const fetchMaybeYouWillLikeProducts = async () => {
      try {
        // Fetch all products
        const response = await fetch('/api/products');
        if (!response.ok) return;
        
        const data = await response.json();
        if (!data.success || !data.products) return;

        const allProducts = data.products as Product[];
        const currentProductId = product.id || product.productid;
        
        // Filter out current product and non-visible products
        const otherProducts = allProducts.filter(p => {
          const pid = p.id || p.productid;
          return pid !== currentProductId && p.visible !== false;
        });

        // If no other products, don't show section
        if (otherProducts.length === 0) {
          setMaybeYouWillLikeProducts([]);
          return;
        }

        // Get current product's property values and category
        const currentPropertyValues = product.propertyValues || (product as any).propertyvalues || {};
        const currentCategoryId = product.productTypeID || (product as any).producttypeid;

        // Priority groups
        const sameCharacteristics: Product[] = [];
        const sameCategory: Product[] = [];
        const rest: Product[] = [];

        otherProducts.forEach(p => {
          const pid = p.id || p.productid;
          if (pid === currentProductId) return;

          const productPropertyValues = p.propertyValues || (p as any).propertyvalues || {};
          const productCategoryId = p.productTypeID || (p as any).producttypeid;

          // Check if shares characteristics (at least one property value match)
          const hasMatchingCharacteristics = Object.keys(currentPropertyValues).some(propId => {
            const currentValue = currentPropertyValues[propId];
            const productValue = productPropertyValues[propId];
            return currentValue && productValue && currentValue === productValue;
          });

          if (hasMatchingCharacteristics) {
            sameCharacteristics.push(p);
          } else if (productCategoryId === currentCategoryId) {
            sameCategory.push(p);
          } else {
            rest.push(p);
          }
        });

        // Combine: characteristics first, then category, then rest, up to at least 4 items
        const suggestedProducts: Product[] = [];
        
        // Add same characteristics products (up to 4)
        suggestedProducts.push(...sameCharacteristics.slice(0, 4));
        
        // If we need more, add same category products
        if (suggestedProducts.length < 4) {
          const needed = 4 - suggestedProducts.length;
          suggestedProducts.push(...sameCategory.slice(0, needed));
        }
        
        // If we still need more, add rest
        if (suggestedProducts.length < 4) {
          const needed = 4 - suggestedProducts.length;
          suggestedProducts.push(...rest.slice(0, needed));
        }

        // If there are fewer than 4 total, show what's available
        if (suggestedProducts.length > 0) {
          setMaybeYouWillLikeProducts(suggestedProducts);
        } else {
          setMaybeYouWillLikeProducts([]);
        }
      } catch (error) {
        console.error('Error fetching maybe you will like products:', error);
        setMaybeYouWillLikeProducts([]);
      }
    };

    if (product.id || product.productid) {
      fetchMaybeYouWillLikeProducts();
    }
  }, [product.id, product.productid, product.propertyValues, product.productTypeID]);

  const handleVariantImageChange = useCallback((images: string[] | string | undefined) => {
    // Only update focus; keep the product photo gallery (1–4) intact.
    if (images) {
      if (Array.isArray(images)) {
        setFocusImage(images.length > 0 ? images[0] : null);
      } else {
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
        {/* Two-column layout - reordered for mobile */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-16">
          {/* Left column - Product Images (hidden on mobile, shown on desktop) */}
          <div className="product__detail__left order-3 md:order-1">
            {/* Gallery - hidden on mobile, shown on desktop */}
            <div className="hidden md:block">
              <ProductMediaGallery 
                images={galleryImages} 
                productName={`${product.brand} ${product.model}`}
                focusImage={focusImage}
              />
            </div>
            
            {/* Expandable Product Description Section (order 8 on mobile) */}
            {product.description && (
              <div 
                className="mt-8 md:mt-8 border rounded-lg overflow-hidden order-8 md:order-none"
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

            {/* Expandable Delivery Information Section (order 9 on mobile) */}
            <div 
              className="mt-4 border rounded-lg overflow-hidden order-9 md:order-none"
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

          {/* Right column - Product Info (order 1-7 on mobile, 2 on desktop) */}
          <div className="product__detail__right order-1 md:order-2">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
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
                      {relatedProduct.images?.[0] && (
                        <img
                          src={relatedProduct.images[0]}
                          alt={`${relatedProduct.brand} ${relatedProduct.model}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
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

        {/* Maybe You Will Like Section */}
        {maybeYouWillLikeProducts.length > 0 && (
          <div className="mt-16 pt-16 border-t" style={{ borderColor: theme.colors.border }}>
            <h2 
              className="text-2xl font-bold mb-8"
              style={{ color: theme.colors.text }}
            >
              {t.maybeYouWillLike}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
              {maybeYouWillLikeProducts.map((suggestedProduct) => (
                <div key={suggestedProduct.id || suggestedProduct.productid}>
                  <ProductCard product={suggestedProduct} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

