'use client';

import { useState } from 'react';
import ProductCard from './ProductCard';
import { Product } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { translations } from '@/lib/translations';

interface StorePageProps {
  products: Product[];
  currentPage: string;
}

export default function StorePage({ products, currentPage }: StorePageProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { language } = useLanguage();
  const { theme } = useTheme();
  const t = translations[language];

  const categories = [
    { id: 'all', label: t.all },
    { id: 'clothes', label: t.clothes },
    { id: 'shoes', label: t.shoes },
    { id: 'accessories', label: t.accessories }
  ];

  const activeCategoryFilter = currentPage === 'home' ? selectedCategory : currentPage;
  
  const filteredProducts = products.filter(p => {
    if (!p.visible) return false;
    if (activeCategoryFilter === 'all') return true;
    return p.category === activeCategoryFilter;
  });

  const getPageTitle = () => {
    if (currentPage === 'home') return t.ourCurrentStock;
    if (currentPage === 'clothes') return t.clothesInStock;
    if (currentPage === 'shoes') return t.shoesInStock;
    if (currentPage === 'accessories') return t.accessoriesInStock;
  };

  const isGradientTheme = theme.id === 'gradient';

  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{ 
        background: isGradientTheme ? theme.colors.background : theme.colors.background
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <h1 
            className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-2 sm:mb-3 px-2 transition-colors duration-300"
            style={{ color: theme.colors.text }}
          >
            {getPageTitle()}
          </h1>
          <p 
            className="text-base sm:text-lg mb-1 px-2 transition-colors duration-300"
            style={{ color: theme.colors.textSecondary }}
          >
            {t.browseDescription}
          </p>
          <p 
            className="text-xs sm:text-sm px-2 transition-colors duration-300"
            style={{ color: theme.colors.textSecondary }}
          >
            {t.allItemsInStock}
          </p>
        </div>

        {currentPage === 'home' && (
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-10 px-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300"
                style={{
                  backgroundColor: selectedCategory === cat.id 
                    ? theme.colors.primary 
                    : theme.colors.cardBg,
                  color: selectedCategory === cat.id 
                    ? '#ffffff' 
                    : theme.colors.text,
                  border: selectedCategory === cat.id 
                    ? 'none' 
                    : `1px solid ${theme.colors.border}`,
                  boxShadow: selectedCategory === cat.id 
                    ? theme.effects.shadowHover 
                    : 'none'
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory !== cat.id) {
                    e.currentTarget.style.backgroundColor = theme.colors.surface;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== cat.id) {
                    e.currentTarget.style.backgroundColor = theme.colors.cardBg;
                  }
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 sm:py-16">
            <p 
              className="text-base sm:text-lg px-4 transition-colors duration-300"
              style={{ color: theme.colors.textSecondary }}
            >
              {t.noProductsAvailable}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

