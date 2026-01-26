'use client';

import { useState } from 'react';
import ProductCard from './ProductCard';
import ProductFilters from './ProductFilters';
import { Product } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useProductTypes } from '@/context/ProductTypeContext';
import { useProperties } from '@/context/PropertiesContext';
import { translations } from '@/lib/translations';

interface StorePageProps {
  products: Product[];
  currentPage: string;
}

export default function StorePage({ products, currentPage }: StorePageProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});
  const [showFilters, setShowFilters] = useState(false); // Always collapsed on page refresh
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { productTypes } = useProductTypes();
  const { properties } = useProperties();
  const t = translations[language];
  
  // Create a map from propertyId to property name for filtering
  const propertyIdToNameMap = new Map<string, string>();
  properties.forEach(property => {
    const propertyId = property.propertyid || (property as any).PropertyID || (property as any).id;
    const propertyName = property.name || (property as any).Name;
    if (propertyId && propertyName) {
      propertyIdToNameMap.set(propertyId, propertyName);
    }
  });

  // Map currentPage to rfproducttypeid for category pages
  const getRfProductTypeId = (page: string) => {
    const mapping: Record<string, number> = {
      'for-him': 1,
      'for-her': 2,
      'accessories': 3
    };
    return mapping[page];
  };

  const currentRfProductTypeId = getRfProductTypeId(currentPage);

  // Filter categories to only show those with available products
  const availableCategories = productTypes.filter(type => {
    return products.some(p =>
      p.visible &&
      (p.quantity > 0 || p.variants?.length === 0) && // Show products with quantity OR products with no variants (newly created)
      p.productTypeID === type.producttypeid
    );
  });

  const categories = [
    { id: 'all', label: t.all },
    ...availableCategories.map(type => ({
      id: type.producttypeid,
      label: type.name,
      code: ((type as any).code || type.name || '').toLowerCase()
    }))
  ];

  const activeCategoryFilter = currentPage === 'home' ? selectedCategory : selectedCategory;

  const filteredProducts = products.filter(p => {
    if (!p.visible) return false;
    // Show products with quantity > 0 OR products with no variants (newly created products)
    if (p.quantity <= 0 && p.variants && p.variants.length > 0) return false;

    // Category/Product Type filtering
    if (activeCategoryFilter === 'all') {
      // Show all products
    } else {
      // Check if we're filtering by product type ID (new system)
      const productType = productTypes.find(type => type.producttypeid === activeCategoryFilter);
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
          // Handle both string and array property values
          const valueToParse = Array.isArray(propertyValue) ? propertyValue[0] : propertyValue;
          const numericValue = parseFloat(valueToParse);
          const filterNumber = parseFloat(filterValue);

          if (!isNaN(numericValue) && !isNaN(filterNumber)) {
            if (isMin && numericValue < filterNumber) return false;
            if (!isMin && numericValue > filterNumber) return false;
          }
        }
        continue;
      }

      // Regular property filtering
      // filterKey is propertyId, map it to property name first
      const propertyName = propertyIdToNameMap.get(filterKey) || filterKey;
      
      // Try propertyValues using property name first
      let propertyValue = p.propertyValues?.[propertyName];
      let matched = false;
      
      // Check if propertyValue matches filter
      if (propertyValue) {
        if (typeof filterValue === 'string' && propertyValue === filterValue) {
          matched = true;
        } else if (typeof filterValue === 'string' && typeof propertyValue === 'string' && propertyValue.toLowerCase().includes(filterValue.toLowerCase())) {
          matched = true;
        }
      }
      
      // Also check ALL variants for property values - match by propertyId OR property name
      // A product matches if ANY variant has the matching property value
      if (!matched) {
        const productVariants = p.variants || p.Variants || [];
        for (const variant of productVariants) {
          const propertyValues = variant.ProductVariantPropertyvalues || 
                                variant.ProductVariantPropertyValues || 
                                variant.product_variant_property_values ||
                                variant.productVariantPropertyvalues ||
                                [];
          for (const pv of propertyValues) {
            const propId = pv.propertyid || pv.PropertyID || pv.Property?.propertyid || pv.properties?.propertyid;
            const propName = pv.Property?.name || pv.Property?.Name || pv.properties?.name || pv.properties?.Name || '';
            // Match by propertyId OR property name
            if (propId === filterKey || propName === propertyName || propName === filterKey) {
              const variantValue = pv.value || pv.Value || '';
              // Check if this variant's value matches the filter
              if (variantValue && typeof filterValue === 'string') {
                if (variantValue === filterValue) {
                  matched = true;
                  break;
                } else if (typeof variantValue === 'string' && variantValue.toLowerCase().includes(filterValue.toLowerCase())) {
                  matched = true;
                  break;
                }
              }
            }
          }
          if (matched) break;
        }
      }
      
      // Fallback to legacy field if still no match
      if (!matched) {
        // Also handle legacy- prefix (e.g., "legacy-size" -> "size")
        let legacyField = filterKey.toLowerCase();
        if (legacyField.startsWith('legacy-')) {
          legacyField = legacyField.replace('legacy-', '');
        }
        const legacyValue = (p as any)[legacyField];
        if (legacyValue && typeof filterValue === 'string') {
          if (legacyValue === filterValue) {
            matched = true;
          } else if (typeof legacyValue === 'string' && legacyValue.toLowerCase().includes(filterValue.toLowerCase())) {
            matched = true;
          }
        }
      }

      // If no match found, exclude this product
      if (!matched) {
        return false;
      }
    }

    return true;
  });

  const getPageTitle = () => {
    if (currentPage === 'home') return t.ourCurrentStock;

    // Check if currentPage matches a product type ID
    const productType = productTypes.find(type => type.producttypeid === currentPage);
    if (productType) {
      return language === 'bg'
        ? `${productType.name} в наличност`
        : `${productType.name} in Stock`;
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

        <ProductFilters
          products={products}
          selectedFilters={selectedFilters}
          onFiltersChange={setSelectedFilters}
          isVisible={showFilters}
          onToggleVisibility={() => setShowFilters(!showFilters)}
          selectedProductTypeId={
            productTypes.some(type => type.producttypeid === selectedCategory)
              ? selectedCategory
              : null
          }
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

