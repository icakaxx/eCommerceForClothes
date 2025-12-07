'use client';

import { useRouter } from 'next/navigation';
import ImageSlider from './ImageSlider';
import { Product } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { translations } from '@/lib/translations';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const t = translations[language];

  const getCategoryLabel = () => {
    if (product.category === 'clothes') return product.type || t.clothes;
    if (product.category === 'shoes') return t.shoes;
    if (product.category === 'accessories') return t.accessories;
    return '';
  };

  const handleClick = () => {
    router.push(`/products/${product.id}`);
  };

  return (
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
      <ImageSlider images={product.images} />
      
      <div className="p-4 sm:p-5">
        <h3 
          className="text-base sm:text-lg font-semibold mb-2 line-clamp-2 transition-colors duration-300"
          style={{ color: theme.colors.text }}
        >
          {product.brand} – {product.model}
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
            €{product.price.toFixed(2)}
          </div>
          <div 
            className="text-xs mt-0.5 transition-colors duration-300"
            style={{ color: theme.colors.textSecondary }}
          >
            {t.inclVAT}
          </div>
        </div>
      </div>
    </div>
  );
}

