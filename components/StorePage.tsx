'use client';

import { useState } from 'react';
import ProductCard from './ProductCard';
import ProductFilters from './ProductFilters';
import { Product } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useProductTypes } from '@/context/ProductTypeContext';
import { translations } from '@/lib/translations';

interface StorePageProps {
  products: Product[];
  currentPage: string;
}

export default function StorePage({ products, currentPage }: StorePageProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});
  const [showFilters, setShowFilters] = useState(false);
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { productTypes } = useProductTypes();
  const t = translations[language];

  const categories = [
    { id: 'all', label: t.all },
    ...productTypes.map(type => ({
      id: type.ProductTypeID,
      label: type.Name,
      code: type.Code.toLowerCase()
    }))
  ];

  const activeCategoryFilter = currentPage === 'home' ? selectedCategory : currentPage;

  const filteredProducts = products.filter(p => {
    if (!p.visible) return false;

    // Category/Product Type filtering
    if (activeCategoryFilter === 'all') {
      // Show all products
    } else {
      // Check if we're filtering by product type ID (new system)
      const productType = productTypes.find(type => type.ProductTypeID === activeCategoryFilter);
      if (productType) {
        if (p.productTypeID !== activeCategoryFilter) return false;
      } else {
        // Fallback to legacy category filtering
        if (p.category !== activeCategoryFilter) return false;
      }
    }

    // Property-based filtering
    for (const [filterKey, filterValue] of Object.entries(selectedFilters)) {
      if (!filterValue || filterValue === '') continue;

      // Handle range filters (min/max)
      if (filterKey.endsWith('_min') || filterKey.endsWith('_max')) {
        const propertyName = filterKey.replace(/_(min|max)$/, '');
        const isMin = filterKey.endsWith('_min');

        // First try propertyValues, then fallback to legacy fields
        let propertyValue = p.propertyValues?.[propertyName];
        if (!propertyValue) {
          // Fallback to legacy field (convert to lowercase for matching)
          const legacyField = propertyName.toLowerCase();
          propertyValue = (p as any)[legacyField];
        }

        if (propertyValue) {
          const numericValue = parseFloat(propertyValue);
          const filterNumber = parseFloat(filterValue);

          if (!isNaN(numericValue) && !isNaN(filterNumber)) {
            if (isMin && numericValue < filterNumber) return false;
            if (!isMin && numericValue > filterNumber) return false;
          }
        }
        continue;
      }

      // Regular property filtering
      // First try propertyValues, then fallback to legacy fields
      let propertyValue = p.propertyValues?.[filterKey];
      if (!propertyValue) {
        // Fallback to legacy field (convert to lowercase for matching)
        const legacyField = filterKey.toLowerCase();
        propertyValue = (p as any)[legacyField];
      }

      if (!propertyValue) return false;

      // For text filters, check if the property value contains the filter value (case insensitive)
      if (typeof filterValue === 'string' && !propertyValue.toLowerCase().includes(filterValue.toLowerCase())) {
        return false;
      }

      // For exact matches
      if (typeof filterValue === 'string' && propertyValue !== filterValue) {
        return false;
      }
    }

    return true;
  });

  const getPageTitle = () => {
    if (currentPage === 'home') return t.ourCurrentStock;

    // Check if currentPage matches a product type ID
    const productType = productTypes.find(type => type.ProductTypeID === currentPage);
    if (productType) {
      return language === 'bg'
        ? `${productType.Name} в наличност`
        : `${productType.Name} in Stock`;
    }

    // Fallback to legacy categories
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

        <ProductFilters
          products={products}
          selectedFilters={selectedFilters}
          onFiltersChange={setSelectedFilters}
          isVisible={showFilters}
          onToggleVisibility={() => setShowFilters(!showFilters)}
        />

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

