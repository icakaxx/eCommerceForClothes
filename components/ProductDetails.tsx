'use client';

import { useState, useEffect, useMemo } from 'react';
import { Product } from '@/lib/data';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { translations } from '@/lib/translations';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Heart, Share2 } from 'lucide-react';
import Image from 'next/image';
import QuickLoginModal from './QuickLoginModal';
import FomoBadge, { type FomoMessage } from './FomoBadge';

interface ProductDetailsProps {
  product: Product;
  onVariantChange?: (images: string[] | string | undefined) => void;
}


interface Variant {
  productvariantid: string;
  sku?: string;
  price?: number;
  quantity: number;
  isvisible: boolean;
  ProductVariantPropertyvalues?: Array<{
    propertyid: string;
    Property?: {
      propertyid: string;
      name: string;
    };
    value: string;
  }>;
  ProductVariantPropertyValues?: Array<{
    propertyid: string;
    Property?: {
      propertyid: string;
      name: string;
    };
    value: string;
  }>;
  imageurl?: string;
  images?: string[];
  IsPrimaryImage?: boolean;
}

export default function ProductDetails({ product, onVariantChange }: ProductDetailsProps) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { addItem, openCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const t = translations[language];

  // State for variant selection
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [availableOptions, setAvailableOptions] = useState<Record<string, Set<string>>>({});
  const [propertyNameMap, setPropertyNameMap] = useState<Record<string, string>>({}); // Maps lowercase keys to original property names

  // State for favorites and share
  const [isFavorited, setIsFavorited] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [favoriteCount, setFavoriteCount] = useState(0);

  // Check if product is favorited and get favorite count on mount
  useEffect(() => {
    const productId = product.id || product.productid
    
    // Check favorite status if authenticated
    if (isAuthenticated && user && productId) {
      const checkFavorite = async () => {
        try {
          const response = await fetch('/api/favorites/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              productId: productId
            })
          })
          const data = await response.json()
          if (data.success) {
            setIsFavorited(data.isFavorited)
          }
        } catch (error) {
          console.error('Error checking favorite:', error)
        }
      }
      checkFavorite()
    }

    // Get favorite count (public, no auth required)
    const fetchFavoriteCount = async () => {
      try {
        const response = await fetch(`/api/products/${productId}/favorite-count`)
        const data = await response.json()
        if (data.success) {
          setFavoriteCount(data.count)
        }
      } catch (error) {
        console.error('Error fetching favorite count:', error)
      }
    }
    fetchFavoriteCount()
  }, [isAuthenticated, user, product.id, product.productid])

  useEffect(() => {
    // Extract variants from product - handle both Variants and variants
    const productVariants = product.variants || product.Variants || [];

    if (Array.isArray(productVariants) && productVariants.length > 0) {
      console.log('🔍 ProductDetails: Found variants:', productVariants);
      const visibleVariants = productVariants.filter((v: any) => v.isvisible !== false);
      console.log('🔍 ProductDetails: Visible variants:', visibleVariants);
      setVariants(visibleVariants);

      // Build available options map
      const optionsMap: Record<string, Set<string>> = {};
      const nameMap: Record<string, string> = {}; // Maps lowercase keys to original property names
      visibleVariants.forEach((variant: any) => {
        // Handle both naming conventions
        const propertyValues = variant.ProductVariantPropertyvalues || variant.ProductVariantPropertyValues || [];
        console.log(`🔍 ProductDetails: Variant ${variant.productvariantid} property values:`, propertyValues);

        propertyValues.forEach((pv: any) => {
          // Get original property name with proper capitalization
          const originalPropertyName = pv.Property?.name || pv.Property?.Name || pv.propertyid || '';
          // Use lowercase for key matching
          const propertyNameKey = originalPropertyName.toLowerCase();
          const propertyValue = pv.value || pv.Value || '';

          if (propertyNameKey && propertyValue) {
            // Store original property name mapping
            if (!nameMap[propertyNameKey]) {
              nameMap[propertyNameKey] = originalPropertyName;
            }
            if (!optionsMap[propertyNameKey]) {
              optionsMap[propertyNameKey] = new Set();
            }
            optionsMap[propertyNameKey].add(propertyValue);
          }
        });
      });
      console.log('🔍 ProductDetails: Available options map:', optionsMap);
      setAvailableOptions(optionsMap);
      setPropertyNameMap(nameMap);

      // Select first variant by default (or primary variant if available)
      if (visibleVariants.length > 0) {
        const primaryVariant = visibleVariants.find((v: any) => v.IsPrimaryImage) || visibleVariants[0];
        console.log('🔍 ProductDetails: Selected primary variant:', primaryVariant);
        setSelectedVariant(primaryVariant);

        // Set initial selected options
        const initialOptions: Record<string, string> = {};
        const primaryPropertyValues = primaryVariant.ProductVariantPropertyvalues || primaryVariant.ProductVariantPropertyValues || [];
        primaryPropertyValues.forEach((pv: any) => {
          // Get original property name with proper capitalization
          const originalPropertyName = pv.Property?.name || pv.Property?.Name || pv.propertyid || '';
          // Use lowercase for key matching
          const propertyNameKey = originalPropertyName.toLowerCase();
          const propertyValue = pv.value || pv.Value || '';

          if (propertyNameKey && propertyValue) {
            initialOptions[propertyNameKey] = propertyValue;
          }
        });
        console.log('🔍 ProductDetails: Initial selected options:', initialOptions);
        setSelectedOptions(initialOptions);

        // Notify parent of initial variant images (only once on mount)
        if (onVariantChange) {
          if (primaryVariant.images && primaryVariant.images.length > 0) {
            onVariantChange(primaryVariant.images);
          } else if (primaryVariant.imageurl) {
            onVariantChange([primaryVariant.imageurl]);
          } else if (product.images && product.images.length > 0) {
            onVariantChange(product.images);
          }
        }
      }
    } else {
      console.log('🔍 ProductDetails: No variants found. Product:', product);
    }
  }, [product.variants, product.Variants]);

  const handleOptionChange = (propertyName: string, value: string) => {
    console.log(`🔍 ProductDetails: Option changed - ${propertyName}: ${value}`);
    const newOptions = { ...selectedOptions, [propertyName]: value };
    setSelectedOptions(newOptions);

    // Find matching variant
    const matchingVariant = variants.find((variant) => {
      // Handle both naming conventions
      const propertyValues = variant.ProductVariantPropertyvalues || variant.ProductVariantPropertyValues || [];
      if (propertyValues.length === 0) return false;

      const variantOptions: Record<string, string> = {};
      propertyValues.forEach((pv: any) => {
        // Get original property name with proper capitalization
        const originalPropertyName = pv.Property?.name || pv.Property?.Name || pv.propertyid || '';
        // Use lowercase for key matching
        const propNameKey = originalPropertyName.toLowerCase();
        const propValue = pv.value || pv.Value || '';

        if (propNameKey && propValue) {
          variantOptions[propNameKey] = propValue;
        }
      });

      // Check if all selected options match this variant
      const matches = Object.keys(newOptions).every(
        (key) => variantOptions[key] === newOptions[key]
      );

      console.log(`🔍 ProductDetails: Checking variant ${variant.productvariantid}:`, {
        variantOptions,
        newOptions,
        matches
      });

      return matches;
    });

    if (matchingVariant) {
      console.log('🔍 ProductDetails: Matched variant:', matchingVariant);
      setSelectedVariant(matchingVariant);

      // Notify parent component of image change - prioritize variant images, fall back to imageurl, then product images
      if (onVariantChange) {
        if (matchingVariant.images && matchingVariant.images.length > 0) {
          // Variant has specific images - use those
          onVariantChange(matchingVariant.images);
        } else if (matchingVariant.imageurl) {
          // Variant has single image - use that
          onVariantChange([matchingVariant.imageurl]);
        } else if (product.images && product.images.length > 0) {
          // Fall back to product general images
          onVariantChange(product.images);
        } else {
          // No images available
          onVariantChange(undefined);
        }
      }
    } else {
      console.log('🔍 ProductDetails: No matching variant found for options:', newOptions);
      // No matching variant - show general product images
      if (onVariantChange && product.images && product.images.length > 0) {
        onVariantChange(product.images);
      }
    }
  };

  // Get current price and quantity
  const currentPrice = selectedVariant?.price || product.price || 0;
  const currentQuantity = selectedVariant?.quantity || product.quantity || 0;
  const currentPriceBgn = currentPrice * 1.95;

  // Memoize FOMO messages to prevent recreation on every render
  const fomoMessages = useMemo(() => {
    const messages: FomoMessage[] = [];
    
    // Stock-based messages
    if (currentQuantity > 0 && currentQuantity <= 5) {
      messages.push({
        text: language === 'bg' 
          ? `Остават само ${currentQuantity} налични` 
          : `Only ${currentQuantity} left in stock`,
        tone: 'warning'
      });
      messages.push({
        text: language === 'bg' 
          ? 'Ниско наличност — продава се бързо' 
          : 'Low stock — selling fast',
        tone: 'warning'
      });
    }
    
    if (currentQuantity > 5 && currentQuantity <= 15) {
      messages.push({
        text: language === 'bg' 
          ? 'Почти изчерпано' 
          : 'Almost gone',
        tone: 'neutral'
      });
    }
    
    // Social proof messages (using safe approximations)
    messages.push({
      text: language === 'bg' 
        ? 'Популярен избор тази седмица' 
        : 'Popular choice this week',
      tone: 'success'
    });
    
    messages.push({
      text: language === 'bg' 
        ? 'Един от нашите най-продавани' 
        : 'One of our best sellers',
      tone: 'success'
    });
    
    messages.push({
      text: language === 'bg' 
        ? 'Трендов продукт в момента' 
        : 'Trending right now',
      tone: 'neutral'
    });
    
    // Time-based urgency
    messages.push({
      text: language === 'bg' 
        ? 'Високо търсене днес' 
        : 'High demand today',
      tone: 'neutral'
    });
    
    return messages;
  }, [currentQuantity, language]);

  const getCategoryLabel = () => {
    if (product.category === 'clothes') return product.type || t.clothes;
    if (product.category === 'shoes') return t.shoes;
    if (product.category === 'accessories') return t.accessories;
    return '';
  };

  const handleBackToStore = () => {
    router.push(`/`);
  };

  const handleAddToCart = () => {
    if (currentQuantity <= 0) return;

    // Use selectedOptions to get only the selected property values (not all available options)
    const cartCompatiblePropertyValues: Record<string, string> = {};
    
    // Build property values from selectedOptions (user's actual selections)
    if (selectedOptions && Object.keys(selectedOptions).length > 0) {
      Object.entries(selectedOptions).forEach(([key, value]) => {
        // Use the property name mapping to get the correct display name
        const displayName = propertyNameMap[key.toLowerCase()] || key;
        cartCompatiblePropertyValues[displayName] = String(value);
      });
    }

    // Add item to cart
    addItem({
      id: selectedVariant?.productvariantid || product.id,
      name: `${product.brand} ${product.model}`,
      brand: product.brand,
      model: product.model,
      type: product.type,
      color: product.color,
      size: selectedVariant ? selectedOptions['Size'] || selectedOptions['size'] || product.size : product.size,
      price: currentPrice,
      quantity: 1, // Default to 1, user can adjust in cart
      imageUrl: selectedVariant?.imageurl || product.images?.[0] || '/image.png',
      category: product.category,
      propertyValues: Object.keys(cartCompatiblePropertyValues).length > 0 ? cartCompatiblePropertyValues : undefined,
    });

    // Open cart drawer
    openCart();
  };

  const handleShare = async () => {
    const shareData = {
      title: `${product.brand} ${product.model}`,
      text: `Check out this ${product.type || 'product'} from ${product.brand}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareMessage('Shared successfully!');
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        setShareMessage('Link copied to clipboard!');
      }
      setTimeout(() => setShareMessage(''), 3000);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated || !user) {
      setShowLoginModal(true)
      return
    }

    setIsTogglingFavorite(true)
    const productId = product.id || product.productid

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          productId: String(productId || '')
        })
      })

      const data = await response.json()
      if (data.success) {
        setIsFavorited(data.isFavorited)
        // Update favorite count
        const countResponse = await fetch(`/api/products/${productId}/favorite-count`)
        const countData = await countResponse.json()
        if (countData.success) {
          setFavoriteCount(countData.count)
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setIsTogglingFavorite(false)
    }
  };

  // Get product image for mobile display
  const productImage = selectedVariant?.imageurl || 
    (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : 
    (Array.isArray(product.Images) && product.Images.length > 0 ? 
      (typeof product.Images[0] === 'string' ? product.Images[0] : product.Images[0].imageurl || product.Images[0].url) : 
    '/image.png'));

  return (
    <div className="product-details flex flex-col">
      {/* Back button - order 1 */}
      <button
        onClick={handleBackToStore}
        className="mb-4 flex items-center gap-2 text-sm transition-colors duration-300 hover:underline order-1"
        style={{ color: theme.colors.textSecondary }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        {t.backTo} {getCategoryLabel()}
      </button>

      {/* Product Name and Actions - order 2 */}
      <div className="flex items-start justify-between gap-4 mb-2 order-2">
        <h1 
          className="product__single__name text-3xl md:text-4xl font-bold capitalize transition-colors duration-300 flex-1"
          style={{ color: theme.colors.text }}
        >
          {product.brand} {product.model}
        </h1>
        
        {/* Share and Wishlist Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-full hover:opacity-80 transition-all duration-200"
            style={{ 
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`
            }}
            title={t.share}
          >
            <Share2 size={20} style={{ color: theme.colors.text }} />
          </button>
          <button
            onClick={handleFavorite}
            disabled={isTogglingFavorite}
            className="p-2 rounded-full hover:opacity-80 transition-all duration-200 disabled:opacity-50"
            style={{ 
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`
            }}
            title={isFavorited ? t.removeFromFavorites : t.addToFavorites}
          >
            <Heart 
              size={20} 
              style={{ color: isFavorited ? '#ef4444' : theme.colors.text }}
              fill={isFavorited ? '#ef4444' : 'none'}
            />
          </button>
        </div>
      </div>

      {/* Mobile Image - order 3 (only visible on mobile) */}
      <div className="mb-6 order-3 md:hidden">
        <div className="relative w-full aspect-square rounded-lg overflow-hidden" style={{ backgroundColor: theme.colors.cardBg }}>
          <Image
            src={productImage}
            alt={`${product.brand} ${product.model}`}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>
      </div>

      {/* Share Message */}
      {shareMessage && (
        <div 
          className="mb-2 px-3 py-1.5 text-sm rounded-md order-2"
          style={{
            backgroundColor: theme.colors.surface,
            color: theme.colors.text
          }}
        >
          {shareMessage}
        </div>
      )}

      {/* Product Subtitle (if available) */}
      {product.subtitle && (
        <p 
          className="text-lg mb-2 transition-colors duration-300 order-2"
          style={{ color: theme.colors.textSecondary }}
        >
          {product.subtitle}
        </p>
      )}

      {/* Price - order 4 */}
      <div 
        className="mb-8 pb-6 border-b order-4"
        style={{ borderColor: theme.colors.border }}
      >
        <div 
          className="text-4xl font-bold transition-colors duration-300"
          style={{ color: theme.colors.primary }}
        >
          €{currentPrice.toFixed(2)} / {currentPriceBgn.toFixed(2)} лв
        </div>
        <div 
          className="text-sm mt-1 transition-colors duration-300"
          style={{ color: theme.colors.textSecondary }}
        >
          {t.inclVAT}
        </div>
        
        {/* FOMO Badge - Product Page */}
        {fomoMessages.length > 0 && (
          <div className="mt-4">
            <FomoBadge 
              messages={fomoMessages} 
              rotationInterval={8000}
              enabled={true}
            />
          </div>
        )}
      </div>

      {/* Variant Options - order 5 */}
      {Object.keys(availableOptions).length > 0 && (
        <div className="mb-8 order-5">
          <h3
            className="text-lg font-semibold mb-4 transition-colors duration-300"
            style={{ color: theme.colors.text }}
          >
            {t.selectOptions}
          </h3>
          {Object.entries(availableOptions).map(([propertyNameKey, values]) => {
            // Get original property name with proper capitalization
            const displayName = propertyNameMap[propertyNameKey] || propertyNameKey;
            return (
            <div key={propertyNameKey} className="mb-4">
              <label
                className="block text-sm font-medium mb-2 transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {displayName}
              </label>
              <div className="flex flex-wrap gap-2">
                {Array.from(values).map((value) => {
                  const isSelected = selectedOptions[propertyNameKey] === value;
                  return (
                    <button
                      key={value}
                      onClick={() => handleOptionChange(propertyNameKey, value)}
                      className="px-4 py-2 rounded-lg border-2 transition-all duration-200 hover:scale-105"
                      style={{
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                        color: isSelected ? '#ffffff' : theme.colors.text,
                      }}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Favorite Count - order 6 */}
      {favoriteCount > 0 && (
        <div 
          className="mb-6 order-6"
          style={{ color: theme.colors.textSecondary }}
        >
          <div className="flex items-center gap-2 text-sm">
            <Heart size={16} style={{ color: '#ef4444' }} fill="#ef4444" />
            <span>
              {favoriteCount} {t.peopleFavorited}
            </span>
          </div>
        </div>
      )}

      {/* Product Attributes - order 7 */}
      <div className="product__single__attributes mb-8 order-7">
        <h3
          className="text-lg font-semibold mb-4 transition-colors duration-300"
          style={{ color: theme.colors.text }}
        >
          {t.productDetails}
        </h3>
        <ul
          className="space-y-3 transition-colors duration-300"
          style={{ color: theme.colors.textSecondary }}
        >
          <li className="flex">
            <span className="font-medium w-32" style={{ color: theme.colors.text }}>{t.brand}:</span>
            <span>{product.brand}</span>
          </li>
          <li className="flex">
            <span className="font-medium w-32" style={{ color: theme.colors.text }}>{t.model}:</span>
            <span>{product.model}</span>
          </li>
          <li className="flex">
            <span className="font-medium w-32" style={{ color: theme.colors.text }}>{t.category}:</span>
            <span className="capitalize">{getCategoryLabel()}</span>
          </li>
        </ul>
      </div>

      {/* Stock Availability */}
      <div 
        className="p-4 rounded-lg mb-6 order-6"
        style={{ 
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          {currentQuantity > 0 ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: '#10b981' }}
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span 
                className="font-semibold"
                style={{ color: '#10b981' }}
              >
                {t.inStock}
              </span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: '#ef4444' }}
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              <span 
                className="font-semibold"
                style={{ color: '#ef4444' }}
              >
                {t.outOfStock}
              </span>
            </>
          )}
        </div>
        <p 
          className="text-sm transition-colors duration-300"
          style={{ color: theme.colors.textSecondary }}
        >
          {t.available}: <span className="font-medium" style={{ color: theme.colors.text }}>
            {currentQuantity} {product.category === 'shoes' ? t.pairs : t.pcs}
          </span>
        </p>
      </div>

      {/* Add to Cart Button - order 8 */}
      {product.visible && currentQuantity > 0 && (
        <div className="mb-6 order-8">
          <button
            onClick={handleAddToCart}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center gap-2 font-medium"
          >
            <ShoppingCart size={20} />
            {t.addToCart}
          </button>
        </div>
      )}

      {/* Quick Login Modal */}
      <QuickLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        productId={String(product.id || product.productid || '')}
        onLoginSuccess={() => {
          setShowLoginModal(false)
          // Refresh favorite status after login
          if (isAuthenticated && user) {
            const checkFavorite = async () => {
              try {
                const response = await fetch('/api/favorites/check', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              productId: String(product.id || product.productid || '')
            })
                })
                const data = await response.json()
                if (data.success) {
                  setIsFavorited(data.isFavorited)
                }
              } catch (error) {
                console.error('Error checking favorite:', error)
              }
            }
            checkFavorite()
          }
        }}
      />
     
    </div>
  );
}

