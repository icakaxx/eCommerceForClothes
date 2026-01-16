'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageSlider from './ImageSlider';
import AddToCartModal from './AddToCartModal';
import { Product } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { translations } from '@/lib/translations';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const t = translations[language];
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  const bgnPrice = product.price * 1.95;

  // Deduplicate images - only show unique/distinct images
  const getUniqueImages = (images: string[] | undefined): string[] => {
    if (!images || images.length === 0) return ['/image.png'];
    
    // Use a Set to track unique image URLs (case-insensitive comparison)
    const seen = new Set<string>();
    const unique: string[] = [];
    
    for (const image of images) {
      // Normalize the URL for comparison (remove query params, trailing slashes, etc.)
      const normalized = image.trim().toLowerCase();
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        unique.push(image); // Keep original URL format
      }
    }
    
    return unique.length > 0 ? unique : ['/image.png'];
  };

  const uniqueImages = getUniqueImages(product.images);

  const getCategoryLabel = () => {
    if (product.category === 'clothes') return product.type || t.clothes;
    if (product.category === 'shoes') return t.shoes;
    if (product.category === 'accessories') return t.accessories;
    return '';
  };

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if modal is open
    if (showAddToCartModal) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // Don't navigate if clicking on the express checkout button or its container
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-express-checkout]')) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    router.push(`/products/${product.id}`);
  };

  return (
    <>
    <div
      className="rounded-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
      style={{
        backgroundColor: theme.colors.cardBg,
        boxShadow: theme.effects.shadow,
        borderRadius: theme.effects.borderRadius
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = theme.effects.shadowHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = theme.effects.shadow;
      }}
    >
      <ImageSlider images={uniqueImages} />
      
      <div className="p-4 sm:p-5">
        <h3 
          className="text-base sm:text-lg font-semibold mb-2 line-clamp-2 transition-colors duration-300"
          style={{ color: theme.colors.text }}
        >
          {product.brand} {product.model}
        </h3>
        
        <span 
          className="inline-block px-2.5 py-1 text-xs rounded-full mb-3 transition-colors duration-300"
          style={{
            backgroundColor: theme.colors.secondary,
            color: theme.colors.primary
          }}
        >
          {getCategoryLabel()}
        </span>
        
        <div 
          className="space-y-1.5 text-xs sm:text-sm mb-4 transition-colors duration-300"
          style={{ color: theme.colors.textSecondary }}
        >
          <div>{t.color}: <span style={{ color: theme.colors.text }}>{product.color}</span></div>
          {product.size && <div>{t.size}: <span style={{ color: theme.colors.text }}>{product.size}</span></div>}
          <div>
            {t.available}: <span 
              className="font-medium"
              style={{ color: theme.colors.text }}
            >
              {product.quantity} {product.category === 'shoes' ? t.pairs : t.pcs}
            </span>
          </div>
        </div>
        
        <div 
          className="pt-4 border-t transition-colors duration-300"
          style={{ borderColor: theme.colors.border }}
        >
          <div 
            className="text-xl sm:text-2xl font-bold transition-colors duration-300"
            style={{ color: theme.colors.primary }}
          >
            €{product.price.toFixed(2)} / {bgnPrice.toFixed(2)} лв
          </div>
          <div
            className="text-xs mt-0.5 transition-colors duration-300"
            style={{ color: theme.colors.textSecondary }}
          >
            {t.inclVAT}
          </div>
        </div>

        {/* Express Add Button */}
        {product.visible && product.quantity > 0 && (
          <div data-express-checkout className="relative z-10">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAddToCartModal(true);
              }}
              onMouseDown={(e) => {
                // Prevent card click from firing when clicking the button
                e.preventDefault();
                e.stopPropagation();
              }}
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center gap-2"
            >
              <ShoppingCart size={16} />
              {t.expressAdd}
            </button>
          </div>
        )}
      </div>
    </div>

    <AddToCartModal
      isOpen={showAddToCartModal}
      onClose={() => setShowAddToCartModal(false)}
      product={product}
    />
    </>
  );
}

