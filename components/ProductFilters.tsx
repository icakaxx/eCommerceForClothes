'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Filter, ChevronDown, Search } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useProperties } from '@/context/PropertiesContext';
import { translations } from '@/lib/translations';
import { Product } from '@/lib/data';

interface ProductFiltersProps {
  products: Product[];
  selectedFilters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
  selectedProductTypeId?: string | null;
}

export default function ProductFilters({
  products,
  selectedFilters,
  onFiltersChange,
  isVisible,
  onToggleVisibility,
  selectedProductTypeId
}: ProductFiltersProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { properties } = useProperties();
  const t = translations[language];
  const [availableValues, setAvailableValues] = useState<Record<string, string[]>>({});
  const [dropdownStates, setDropdownStates] = useState<Record<string, { isOpen: boolean; searchTerm: string }>>({});
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [allowedPropertyIds, setAllowedPropertyIds] = useState<string[] | null>(null);

  const getPropertyId = (property: any) =>
    property.propertyid || property.PropertyID || property.id;

  useEffect(() => {
    const loadAllowedProperties = async () => {
      if (!selectedProductTypeId) {
        setAllowedPropertyIds(null);
        return;
      }

      try {
        const response = await fetch(`/api/product-types/${selectedProductTypeId}/properties`);
        const result = await response.json();
        if (result.success) {
          const ids = (result.properties || [])
            .map((ptp: any) => ptp?.properties?.propertyid)
            .filter(Boolean);
          setAllowedPropertyIds(ids);
        } else {
          setAllowedPropertyIds(null);
        }
      } catch (error) {
        console.error('Failed to load product type properties:', error);
        setAllowedPropertyIds(null);
      }
    };

    loadAllowedProperties();
  }, [selectedProductTypeId]);

  const visibleProperties = allowedPropertyIds
    ? properties.filter((property: any) => allowedPropertyIds.includes(getPropertyId(property)))
    : properties;

  // Load available values from property_values table (via properties context)
  // Filter to only show values that exist in the products on this page
  useEffect(() => {
    const values: Record<string, string[]> = {};

    // First, extract all actual values from products to filter database values
    // Use propertyId as key (not propertyName) since multiple properties can have the same name
    const productValues: Record<string, Set<string>> = {};
    
    // Create a map from propertyId to propertyName for lookup
    const propertyIdToNameMap: Record<string, string> = {};
    visibleProperties.forEach(property => {
      const propertyId = getPropertyId(property);
      const propertyName = property.name || (property as any).Name;
      if (propertyId && propertyName) {
        propertyIdToNameMap[propertyId] = propertyName;
      }
    });
    
    products.forEach(product => {
      // Extract from propertyValues (new system) - this uses propertyName as key
      // We need to map it to propertyId if possible, but for now keep as legacy support
      if (product.propertyValues) {
        Object.entries(product.propertyValues).forEach(([propertyName, value]) => {
          if (value && typeof value === 'string') {
            // Find propertyId for this propertyName (there might be multiple with same name)
            // For legacy support, keep propertyName key but prefer propertyId from variants
            if (!productValues[propertyName]) {
              productValues[propertyName] = new Set();
            }
            productValues[propertyName].add(value);
          }
        });
      }

      // Extract from variants (new system) - check all variants
      // Use propertyId as the key to avoid collisions from duplicate property names
      const productVariants = product.variants || product.Variants || [];
      productVariants.forEach((variant: any) => {
        const propertyValues = variant.ProductVariantPropertyvalues || 
                              variant.ProductVariantPropertyValues || 
                              variant.product_variant_property_values ||
                              variant.productVariantPropertyvalues ||
                              [];
        propertyValues.forEach((pv: any) => {
          const propertyId = pv.propertyid || pv.PropertyID || pv.Property?.propertyid || pv.properties?.propertyid;
          const propertyValue = pv.value || pv.Value || '';
          if (propertyId && propertyValue) {
            // Use propertyId as key to avoid collisions from duplicate property names
            if (!productValues[propertyId]) {
              productValues[propertyId] = new Set();
            }
            productValues[propertyId].add(propertyValue);
          }
        });
      });

      // Extract from legacy fields
      const legacyFields = ['color', 'size', 'type', 'brand', 'model'];
      legacyFields.forEach(field => {
        const value = (product as any)[field];
        if (value && typeof value === 'string') {
          const propertyName = field.charAt(0).toUpperCase() + field.slice(1);
          if (!productValues[propertyName]) {
            productValues[propertyName] = new Set();
          }
          productValues[propertyName].add(value);
        }
      });
    });

    // Use values from property_values table (via properties context), but filter to only include
    // values that actually exist in the products on this page
    visibleProperties.forEach(property => {
      const propertyId = getPropertyId(property);
      const propertyName = property.name || (property as any).Name;
      
      if (property.values && property.values.length > 0 && propertyId) {
        // Get all active values from property_values table
        const allActiveValues = property.values
          .filter((pv: any) => pv.isactive !== false)
          .map((pv: any) => pv.value);

        // Filter to only include values that exist in products
        // Prefer propertyId as key (unique), fallback to propertyName for legacy
        const productValuesSet = productValues[propertyId] || productValues[propertyName] || new Set();
        const filteredValues = allActiveValues.filter((value: string) => productValuesSet.has(value));

        // Sort the filtered values
        const sortedValues = filteredValues.sort((a: string, b: string) => {
          const pvA = property.values?.find((pv: any) => pv.value === a);
          const pvB = property.values?.find((pv: any) => pv.value === b);
          if (pvA?.displayorder !== undefined && pvB?.displayorder !== undefined) {
            return pvA.displayorder - pvB.displayorder;
          }
          return a.localeCompare(b);
        });
        
        if (sortedValues.length > 0) {
          // Use propertyId as key to store values, but we'll display using propertyName in the UI
          values[propertyId] = sortedValues;
        }
      }
    });

    // Fallback: Use values extracted from products for properties that don't have values in the database
    // or for legacy properties
    const propertiesWithValues = new Set(Object.keys(values));
    Object.entries(productValues).forEach(([propertyName, valueSet]) => {
      if (!propertiesWithValues.has(propertyName)) {
        const valueArray = Array.from(valueSet).sort();
        if (valueArray.length > 0) {
          values[propertyName] = valueArray;
        }
      }
    });

    setAvailableValues(values);
  }, [properties, products, allowedPropertyIds]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.entries(dropdownRefs.current).forEach(([propertyId, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          setDropdownStates(prev => ({
            ...prev,
            [propertyId]: { ...prev[propertyId], isOpen: false, searchTerm: '' }
          }));
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterChange = (propertyId: string, value: any) => {
    const newFilters = { ...selectedFilters };

    if (value === '' || value === null || value === undefined) {
      delete newFilters[propertyId];
    } else {
      newFilters[propertyId] = value;
    }

    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const getFilterCount = () => {
    return Object.keys(selectedFilters).length;
  };

  const renderFilterInput = (property: any) => {
    // Handle both propertyid (lowercase) and PropertyID (uppercase) for compatibility
    const propertyId = property.propertyid || property.PropertyID || property.id;
    // Handle both name (lowercase) and Name (uppercase) for compatibility
    const propertyName = property.name || property.Name;
    // Handle both datatype (lowercase) and DataType (uppercase) for compatibility
    const dataType = property.datatype || property.DataType || 'text';
    const currentValue = selectedFilters[propertyId] || '';
    // availableValues now uses propertyId as key (not propertyName) to avoid collisions
    const values = (propertyId && availableValues[propertyId]) || [];
    const dropdownState = dropdownStates[propertyId] || { isOpen: false, searchTerm: '' };

    // Filter values based on search term (match from anywhere)
    const filteredValues = values.filter((value: string) =>
      value.toLowerCase().includes(dropdownState.searchTerm.toLowerCase())
    );

    const toggleDropdown = () => {
      setDropdownStates(prev => ({
        ...prev,
        [propertyId]: {
          ...prev[propertyId],
          isOpen: !prev[propertyId]?.isOpen,
          searchTerm: ''
        }
      }));
    };

    const handleValueSelect = (value: string) => {
      handleFilterChange(propertyId, value);
      setDropdownStates(prev => ({
        ...prev,
        [propertyId]: { ...prev[propertyId], isOpen: false, searchTerm: '' }
      }));
    };

    const handleSearchChange = (searchTerm: string) => {
      setDropdownStates(prev => ({
        ...prev,
        [propertyId]: { ...prev[propertyId], searchTerm }
      }));
    };

    const clearSelection = () => {
      handleFilterChange(propertyId, '');
      setDropdownStates(prev => ({
        ...prev,
        [propertyId]: { ...prev[propertyId], isOpen: false, searchTerm: '' }
      }));
    };

    switch (dataType) {
      case 'select':
        return (
          <div className="relative" ref={(el) => { dropdownRefs.current[propertyId] = el; }}>
            <button
              type="button"
              onClick={toggleDropdown}
              className="w-full px-3 py-2 text-sm border rounded-md transition-colors duration-300 flex items-center justify-between"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }}
            >
              <span className={currentValue ? '' : 'opacity-50'}>
                {currentValue || (language === 'bg' ? 'Изберете...' : 'Select...')}
              </span>
              <div className="flex items-center gap-1">
                {currentValue && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSelection();
                    }}
                    className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-0.5"
                  >
                    <X size={12} />
                  </button>
                )}
                <ChevronDown size={14} className={`transition-transform ${dropdownState.isOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {dropdownState.isOpen && (
              <div
                className="absolute z-50 w-full mt-1 border rounded-md shadow-lg max-h-60 overflow-hidden"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  boxShadow: theme.effects.shadow
                }}
              >
                <div className="p-2 border-b" style={{ borderColor: theme.colors.border }}>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-50" />
                    <input
                      type="text"
                      placeholder={language === 'bg' ? 'Търси...' : 'Search...'}
                      value={dropdownState.searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border rounded transition-colors duration-300"
                      style={{
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>

                <div className="max-h-40 overflow-y-auto">
                  {filteredValues.length === 0 ? (
                    <div className="px-3 py-2 text-sm opacity-50 text-center">
                      {language === 'bg' ? 'Няма резултати' : 'No results'}
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleValueSelect('')}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        style={{
                          color: theme.colors.textSecondary,
                          backgroundColor: !currentValue ? theme.colors.secondary : 'transparent'
                        }}
                      >
                        {language === 'bg' ? 'Всички' : 'All'}
                      </button>
                      {filteredValues.map((value: string) => (
                        <button
                          key={value}
                          onClick={() => handleValueSelect(value)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          style={{
                            color: theme.colors.text,
                            backgroundColor: currentValue === value ? theme.colors.secondary : 'transparent'
                          }}
                        >
                          {value}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'number':
        return (
          <div className="flex gap-2">
            <input
              type="number"
              placeholder={language === 'bg' ? 'Мин' : 'Min'}
              value={selectedFilters[`${propertyId}_min`] || ''}
              onChange={(e) => handleFilterChange(`${propertyId}_min`, e.target.value ? Number(e.target.value) : '')}
              className="flex-1 px-3 py-2 text-sm border rounded-md transition-colors duration-300"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }}
            />
            <input
              type="number"
              placeholder={language === 'bg' ? 'Макс' : 'Max'}
              value={selectedFilters[`${propertyId}_max`] || ''}
              onChange={(e) => handleFilterChange(`${propertyId}_max`, e.target.value ? Number(e.target.value) : '')}
              className="flex-1 px-3 py-2 text-sm border rounded-md transition-colors duration-300"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }}
            />
          </div>
        );

      case 'text':
      default:
        return (
          <div className="relative" ref={(el) => { dropdownRefs.current[propertyId] = el; }}>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-50" />
              <input
                type="text"
                placeholder={language === 'bg' ? 'Търси...' : 'Search...'}
                value={currentValue}
                onChange={(e) => handleFilterChange(propertyId, e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm border rounded-md transition-colors duration-300"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
              {currentValue && (
                <button
                  onClick={() => handleFilterChange(propertyId, '')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        );
    }
  };

  if (!isVisible) {
    return (
      <div className="mb-6 px-2">
        <button
          onClick={onToggleVisibility}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300"
          style={{
            backgroundColor: theme.colors.secondary,
            color: theme.colors.text,
            border: `1px solid ${theme.colors.border}`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.surface;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.secondary;
          }}
        >
          <Filter size={16} />
          {language === 'bg' ? 'Филтри' : 'Filters'}
          {getFilterCount() > 0 && (
            <span
              className="px-2 py-1 text-xs rounded-full"
              style={{
                backgroundColor: theme.colors.primary,
                color: '#ffffff'
              }}
            >
              {getFilterCount()}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      className="mb-6 p-4 rounded-lg border transition-colors duration-300"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-lg font-semibold"
          style={{ color: theme.colors.text }}
        >
          {language === 'bg' ? 'Филтри' : 'Filters'}
        </h3>
        <div className="flex items-center gap-2">
          {getFilterCount() > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm px-3 py-1 rounded transition-colors duration-300"
              style={{
                color: theme.colors.primary,
                backgroundColor: theme.colors.secondary
              }}
            >
              {language === 'bg' ? 'Изчисти всички' : 'Clear All'}
            </button>
          )}
          <button
            onClick={onToggleVisibility}
            className="p-1 rounded transition-colors duration-300"
            style={{
              color: theme.colors.textSecondary,
              backgroundColor: theme.colors.secondary
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleProperties.map(property => {
          const propertyId = getPropertyId(property);
          const propertyName = property.name || (property as any).Name;
          // availableValues now uses propertyId as key (not propertyName) to avoid collisions
          const hasValues = propertyId && availableValues[propertyId] && availableValues[propertyId].length > 0;

          // Only show filters that have available values
          if (!hasValues) return null;

          return (
            <div key={propertyId}>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: theme.colors.text }}
              >
                {property.description || propertyName}
              </label>
              {renderFilterInput(property)}
            </div>
          );
        })}

        {/* Fallback: Show legacy properties if no database properties are available or have values */}
        {visibleProperties.length === 0 || visibleProperties.every(p => {
          const propertyId = getPropertyId(p);
          const nameKey = p.name || (p as any).Name;
          const hasValuesById = propertyId && availableValues[propertyId] && availableValues[propertyId].length > 0;
          const hasValuesByName = nameKey && availableValues[nameKey] && availableValues[nameKey].length > 0;
          return !hasValuesById && !hasValuesByName;
        }) ? (
          <>
            {['Color', 'Size', 'Type', 'Brand', 'Model'].map(legacyProperty => {
              const hasValues = availableValues[legacyProperty] && availableValues[legacyProperty].length > 0;
              if (!hasValues) return null;

              // Create a mock property object for legacy fields
              const mockProperty = {
                propertyid: `legacy-${legacyProperty.toLowerCase()}`,
                name: legacyProperty,
                datatype: legacyProperty.toLowerCase() === 'size' || legacyProperty.toLowerCase() === 'model' ? 'select' : 'text' as 'text' | 'select' | 'number'
              };

              return (
                <div key={mockProperty.propertyid}>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: theme.colors.text }}
                  >
                    {legacyProperty}
                  </label>
                  {renderFilterInput(mockProperty)}
                </div>
              );
            })}
          </>
        ) : null}
      </div>

      {visibleProperties.length === 0 && (
        <p
          className="text-sm text-center py-4"
          style={{ color: theme.colors.textSecondary }}
        >
          {language === 'bg' ? 'Няма налични филтри' : 'No filters available'}
        </p>
      )}
    </div>
  );
}
