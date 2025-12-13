'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/data';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { translations } from '@/lib/translations';
import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';

interface ProductDetailsProps {
  product: Product;
  onVariantChange?: (imageUrl: string | undefined) => void;
}

interface Variant {
  productvariantid: string;
  sku: string;
  price: number;
  quantity: number;
  isvisible: boolean;
  ProductVariantPropertyValues?: Array<{
    propertyid: string;
    Property?: {
      propertyid: string;
      name: string;
    };
    value: string;
  }>;
  imageurl?: string;
  IsPrimaryImage?: boolean;
}

export default function ProductDetails({ product, onVariantChange }: ProductDetailsProps) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { addItem, openCart } = useCart();
  const router = useRouter();
  const t = translations[language];

  // State for variant selection
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [availableOptions, setAvailableOptions] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    // Extract variants from product
    if (product.variants && Array.isArray(product.variants)) {
      const visibleVariants = product.variants.filter((v: any) => v.isvisible !== false);
      setVariants(visibleVariants);

      // Build available options map
      const optionsMap: Record<string, Set<string>> = {};
      visibleVariants.forEach((variant: any) => {
        if (variant.ProductVariantPropertyValues) {
          variant.ProductVariantPropertyValues.forEach((pv: any) => {
            const propertyName = pv.Property?.name || pv.propertyid;
            if (!optionsMap[propertyName]) {
              optionsMap[propertyName] = new Set();
            }
            optionsMap[propertyName].add(pv.value);
          });
        }
      });
      setAvailableOptions(optionsMap);

      // Select first variant by default (or primary variant if available)
      if (visibleVariants.length > 0) {
        const primaryVariant = visibleVariants.find((v: any) => v.IsPrimaryImage) || visibleVariants[0];
        setSelectedVariant(primaryVariant);

        // Set initial selected options
        const initialOptions: Record<string, string> = {};
        if (primaryVariant.ProductVariantPropertyValues) {
          primaryVariant.ProductVariantPropertyValues.forEach((pv: any) => {
            const propertyName = pv.Property?.name || pv.propertyid;
            initialOptions[propertyName] = pv.value;
          });
        }
        setSelectedOptions(initialOptions);
        
        // Notify parent of initial variant image (only once on mount)
        if (onVariantChange && primaryVariant.imageurl) {
          onVariantChange(primaryVariant.imageurl);
        }
      }
    }
  }, [product.variants]); // Removed onVariantChange from dependencies

  const handleOptionChange = (propertyName: string, value: string) => {
    const newOptions = { ...selectedOptions, [propertyName]: value };
    setSelectedOptions(newOptions);

    // Find matching variant
    const matchingVariant = variants.find((variant) => {
      if (!variant.ProductVariantPropertyValues) return false;

      const variantOptions: Record<string, string> = {};
      variant.ProductVariantPropertyValues.forEach((pv) => {
        const propName = pv.Property?.name || pv.propertyid;
        variantOptions[propName] = pv.value;
      });

      // Check if all selected options match this variant
      return Object.keys(newOptions).every(
        (key) => variantOptions[key] === newOptions[key]
      );
    });

    if (matchingVariant) {
      setSelectedVariant(matchingVariant);
      
      // Notify parent component of image change
      if (onVariantChange) {
        onVariantChange(matchingVariant.imageurl);
      }
    }
  };

  // Get current price and quantity
  const currentPrice = selectedVariant?.price || product.price || 0;
  const currentQuantity = selectedVariant?.quantity || product.quantity || 0;

  const getCategoryLabel = () => {
    if (product.category === 'clothes') return product.type || t.clothes;
    if (product.category === 'shoes') return t.shoes;
    if (product.category === 'accessories') return t.accessories;
    return '';
  };

  const handleBackToStore = () => {
    router.push(`/${product.category}`);
  };

  const handleAddToCart = () => {
    if (currentQuantity <= 0) return;

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
      imageUrl: selectedVariant?.imageurl || product.images[0] || '/image.png',
      category: product.category,
      propertyValues: product.propertyValues,
    });

    // Open cart drawer
    openCart();
  };

  return (
    <div className="product-details">
      {/* Back button */}
      <button
        onClick={handleBackToStore}
        className="mb-4 flex items-center gap-2 text-sm transition-colors duration-300 hover:underline"
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
        Back to {getCategoryLabel()}
      </button>

      {/* Product Name */}
      <h1 
        className="product__single__name text-3xl md:text-4xl font-bold mb-2 capitalize transition-colors duration-300"
        style={{ color: theme.colors.text }}
      >
        {product.brand} – {product.model}
      </h1>

      {/* Category Badge */}
      <span 
        className="inline-block px-3 py-1.5 text-sm rounded-full mb-6 transition-colors duration-300"
        style={{
          backgroundColor: theme.colors.secondary,
          color: theme.colors.primary
        }}
      >
        {getCategoryLabel()}
      </span>

      {/* Price */}
      <div 
        className="mb-8 pb-6 border-b"
        style={{ borderColor: theme.colors.border }}
      >
        <div 
          className="text-4xl font-bold transition-colors duration-300"
          style={{ color: theme.colors.primary }}
        >
          €{currentPrice.toFixed(2)}
        </div>
        <div 
          className="text-sm mt-1 transition-colors duration-300"
          style={{ color: theme.colors.textSecondary }}
        >
          {t.inclVAT}
        </div>
      </div>

      {/* Variant Options */}
      {Object.keys(availableOptions).length > 0 && (
        <div className="mb-8">
          <h3 
            className="text-lg font-semibold mb-4 transition-colors duration-300"
            style={{ color: theme.colors.text }}
          >
            Select Options
          </h3>
          {Object.entries(availableOptions).map(([propertyName, values]) => (
            <div key={propertyName} className="mb-4">
              <label 
                className="block text-sm font-medium mb-2 transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {propertyName}
              </label>
              <div className="flex flex-wrap gap-2">
                {Array.from(values).map((value) => {
                  const isSelected = selectedOptions[propertyName] === value;
                  return (
                    <button
                      key={value}
                      onClick={() => handleOptionChange(propertyName, value)}
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
          ))}
          {selectedVariant && (
            <div 
              className="mt-4 p-3 rounded-lg text-sm"
              style={{ 
                backgroundColor: theme.colors.surface,
                color: theme.colors.textSecondary 
              }}
            >
              SKU: <span style={{ color: theme.colors.text }}>{selectedVariant.sku}</span>
            </div>
          )}
        </div>
      )}

      {/* Product Attributes */}
      <div className="product__single__attributes mb-8">
        <h3 
          className="text-lg font-semibold mb-4 transition-colors duration-300"
          style={{ color: theme.colors.text }}
        >
          Product Details
        </h3>
        <ul 
          className="space-y-3 transition-colors duration-300"
          style={{ color: theme.colors.textSecondary }}
        >
          <li className="flex">
            <span className="font-medium w-32" style={{ color: theme.colors.text }}>Brand:</span>
            <span>{product.brand}</span>
          </li>
          <li className="flex">
            <span className="font-medium w-32" style={{ color: theme.colors.text }}>Model:</span>
            <span>{product.model}</span>
          </li>
          <li className="flex">
            <span className="font-medium w-32" style={{ color: theme.colors.text }}>{t.color}:</span>
            <span>{product.color}</span>
          </li>
          {product.size && (
            <li className="flex">
              <span className="font-medium w-32" style={{ color: theme.colors.text }}>{t.size}:</span>
              <span>{product.size}</span>
            </li>
          )}
          <li className="flex">
            <span className="font-medium w-32" style={{ color: theme.colors.text }}>Category:</span>
            <span className="capitalize">{getCategoryLabel()}</span>
          </li>
          {/* Display property values from new schema */}
          {product.propertyValues && Object.keys(product.propertyValues).length > 0 && (
            <>
              {Object.entries(product.propertyValues).map(([propertyName, value]) => (
                <li key={propertyName} className="flex">
                  <span className="font-medium w-32" style={{ color: theme.colors.text }}>
                    {propertyName}:
                  </span>
                  <span>{value}</span>
                </li>
              ))}
            </>
          )}
        </ul>
      </div>

      {/* Stock Availability */}
      <div 
        className="p-4 rounded-lg mb-6"
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
                In Stock
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
                Out of Stock
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

      {/* Add to Cart Button */}
      {product.visible && currentQuantity > 0 && (
        <div className="mb-6">
          <button
            onClick={handleAddToCart}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center gap-2 font-medium"
          >
            <ShoppingCart size={20} />
            {t.addToCart}
          </button>
        </div>
      )}

      {/* Quick Info */}
      <div 
        className="grid grid-cols-2 gap-4 p-4 rounded-lg"
        style={{ 
          backgroundColor: theme.colors.cardBg,
          border: `1px solid ${theme.colors.border}`
        }}
      >
        <div className="text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-2"
            style={{ color: theme.colors.primary }}
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <p 
            className="text-xs transition-colors duration-300"
            style={{ color: theme.colors.textSecondary }}
          >
            Free Shipping
          </p>
        </div>
        <div className="text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-2"
            style={{ color: theme.colors.primary }}
          >
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <p 
            className="text-xs transition-colors duration-300"
            style={{ color: theme.colors.textSecondary }}
          >
            Fast Delivery
          </p>
        </div>
      </div>
    </div>
  );
}

