'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageSlider from './ImageSlider';
import AddToCartModal from './AddToCartModal';
import QuickLoginModal from './QuickLoginModal';
import { Product } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { translations } from '@/lib/translations';
import { ShoppingCart, Heart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  isFavorited?: boolean;
}

export default function ProductCard({ product, isFavorited: initialIsFavorited }: ProductCardProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const t = translations[language];
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited || false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const bgnPrice = product.price * 1.95;

  const getUniqueImages = (images: string[] | undefined): string[] => {
    if (!images || images.length === 0) return ['/image.png'];

    const seen = new Set<string>();
    const unique: string[] = [];

    for (const image of images) {
      const normalized = image.trim().toLowerCase();
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        unique.push(image);
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

  useEffect(() => {
    if (initialIsFavorited !== undefined) {
      setIsFavorited(initialIsFavorited);
      return;
    }

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
          });
          const data = await response.json();
          if (data.success) {
            setIsFavorited(data.isFavorited);
          }
        } catch (error) {
          console.error('Error checking favorite:', error);
        }
      };
      checkFavorite();
    }
  }, [isAuthenticated, user, product.id, product.productid, initialIsFavorited]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || !user) {
      setShowLoginModal(true);
      return;
    }

    setIsTogglingFavorite(true);
    const productId = product.id || product.productid;

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          productId: String(productId || '')
        })
      });

      const data = await response.json();
      if (data.success) {
        setIsFavorited(data.isFavorited);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (showAddToCartModal) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-express-checkout]')) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    router.push(`/products/${product.id}`);
  };

  const productTitle = `${product.brand} ${product.model}`.trim();
  const categoryLabel = getCategoryLabel();
  const showNewBadge = product.isfeatured;

  return (
    <>
      <div
        className="rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer border flex flex-col h-full"
        style={{
          backgroundColor: theme.colors.cardBg,
          borderColor: theme.colors.border,
          boxShadow: theme.effects.shadow,
        }}
        onClick={handleClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = theme.effects.shadowHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = theme.effects.shadow;
        }}
      >
        <div className="relative">
          <ImageSlider images={uniqueImages} />
          {showNewBadge && (
            <span
              className="absolute bottom-3 left-3 z-10 px-2.5 py-1 text-[10px] sm:text-xs font-semibold rounded-md text-white"
              style={{ backgroundColor: theme.colors.primary }}
            >
              {language === 'bg' ? 'Нов модел' : 'New'}
            </span>
          )}
          <button
            onClick={handleFavoriteClick}
            disabled={isTogglingFavorite}
            className="absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-110 disabled:opacity-50 shadow-sm"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              color: isFavorited ? '#ef4444' : theme.colors.text
            }}
            title={isFavorited ? t.removeFromFavorites : t.addToFavorites}
          >
            <Heart size={18} fill={isFavorited ? '#ef4444' : 'none'} />
          </button>
        </div>

        <div className="p-3 sm:p-4 flex flex-col flex-1">
          <h3
            className="text-sm sm:text-[15px] font-semibold mb-1 line-clamp-2 leading-snug transition-colors duration-300"
            style={{ color: theme.colors.text }}
          >
            {productTitle}
            {product.color ? ` ${language === 'bg' ? 'цвят' : ''} ${product.color}` : ''}
          </h3>

          {categoryLabel && (
            <p
              className="text-xs mb-2 transition-colors duration-300"
              style={{ color: theme.colors.textSecondary }}
            >
              {product.brand}
              {categoryLabel ? ` • ${categoryLabel}` : ''}
            </p>
          )}

          <p
            className="text-xs mb-3 transition-colors duration-300 hidden sm:block"
            style={{ color: theme.colors.textSecondary }}
          >
            {t.available}:{' '}
            <span style={{ color: theme.colors.text }}>
              {product.quantity} {product.category === 'shoes' ? t.pairs : t.pcs}
            </span>
          </p>

          <p
            className="text-xs mb-3 transition-colors duration-300 sm:hidden"
            style={{ color: theme.colors.textSecondary }}
          >
            {product.quantity} {product.category === 'shoes' ? t.pairs : t.pcs}{' '}
            {language === 'bg' ? 'налични' : 'available'}
          </p>

          <div className="mt-auto">
            <div
              className="text-base sm:text-lg font-bold transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              €{product.price.toFixed(2)} / {bgnPrice.toFixed(2)} лв
            </div>
            <div
              className="text-[10px] sm:text-xs mt-0.5 transition-colors duration-300"
              style={{ color: theme.colors.textSecondary }}
            >
              {t.inclVAT}
            </div>
          </div>

          {product.visible && product.quantity > 0 && (
            <div data-express-checkout className="relative z-10 mt-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowAddToCartModal(true);
                }}
                className="w-full px-4 py-2.5 sm:py-3 text-white rounded-xl transition-colors duration-300 flex items-center justify-center gap-2 text-sm font-medium"
                style={{ backgroundColor: theme.colors.primary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.92';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <ShoppingCart size={16} />
                <span className="hidden sm:inline">{t.expressAdd}</span>
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
      <QuickLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        productId={String(product.id || product.productid || '')}
        onLoginSuccess={() => {
          setShowLoginModal(false);
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
                });
                const data = await response.json();
                if (data.success) {
                  setIsFavorited(data.isFavorited);
                }
              } catch (error) {
                console.error('Error checking favorite:', error);
              }
            };
            checkFavorite();
          }
        }}
      />
    </>
  );
}
