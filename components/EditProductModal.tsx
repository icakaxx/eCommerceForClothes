'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Trash2, Loader2, Check } from 'lucide-react';
import { Product } from '@/lib/data';
import { Property, PropertyValue } from '@/lib/types/product-types';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { translations } from '@/lib/translations';

interface EditProductModalProps {
  product: Product | null; // null for new product
  onClose: () => void;
  onSave: (product: Product) => void;
}

export default function EditProductModal({ product, onClose, onSave }: EditProductModalProps) {
  const isNewProduct = !product || product.id === 0;
  const [formData, setFormData] = useState<Product>(
    product || {
      id: 0,
      category: 'clothes',
      brand: '',
      model: '',
      color: '',
      subtitle: '',
      quantity: 0,
      price: 0,
      visible: true,
      images: [],
      isfeatured: false,
      productTypeID: '',
      propertyValues: {}
    }
  );
  const { language } = useLanguage();
  const { theme } = useTheme();
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImages, setUploadingImages] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Property values state
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyValuesMap, setPropertyValuesMap] = useState<Record<string, PropertyValue[]>>({});
  const [selectedPropertyValues, setSelectedPropertyValues] = useState<Record<string, string[]>>({});
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [productTypes, setProductTypes] = useState<Array<{producttypeid: string, name: string}>>([]);
  
  // Related products state
  const [relatedProductIds, setRelatedProductIds] = useState<string[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loadingRelatedProducts, setLoadingRelatedProducts] = useState(false);

  // Load product types
  const loadProductTypes = async () => {
    try {
      const response = await fetch('/api/product-types');
      const result = await response.json();
      if (response.ok && result.productTypes) {
        setProductTypes(result.productTypes);
      }
    } catch (error) {
      console.error('Error loading product types:', error);
    }
  };

  // Load properties for the selected product type
  const loadPropertiesForProductType = async (productTypeId: string) => {
    if (!productTypeId) {
      setProperties([]);
      setSelectedPropertyValues({});
      return;
    }

    try {
      setLoadingProperties(true);
      const response = await fetch(`/api/product-types/${productTypeId}/properties`);
      const result = await response.json();

      if (response.ok && result.properties) {
        // Extract properties from nested structure
        const properties = (result.properties || [])
          .map((ptp: any) => ptp.properties)
          .filter((p: any) => p !== null && p !== undefined);
        
        console.log('🔍 DEBUG EditProductModal: Raw API response:', result);
        console.log('🔍 DEBUG EditProductModal: Extracted properties:', properties);
        
        setProperties(properties);
        
        // Extract property values from the nested structure
        const propertyValuesMap: Record<string, PropertyValue[]> = {};
        for (const property of properties) {
          if (property.datatype === 'select' && property.values) {
            propertyValuesMap[property.propertyid] = property.values;
            console.log(`🔍 DEBUG EditProductModal: Property "${property.name}" (${property.propertyid}) has values:`, 
              property.values.map((pv: PropertyValue) => ({
                id: pv.propertyvalueid,
                value: pv.value,
                isactive: pv.isactive
              }))
            );
          }
        }
        setPropertyValuesMap(propertyValuesMap);
        
        // Initialize selected values from existing product property values
        const initialSelected: Record<string, string[]> = {};
        properties.forEach((prop: Property) => {
          initialSelected[prop.propertyid] = [];
        });

        console.log('🔍 DEBUG EditProductModal: Product propertyValues:', product?.propertyValues);
        console.log('🔍 DEBUG EditProductModal: Product variants:', product?.variants || product?.Variants);
        
        // Extract property values from ALL variants (not just the first one)
        const variants = product?.variants || product?.Variants || [];
        const propertyValueMap: Record<string, Set<string>> = {}; // propertyid -> Set of value strings
        
        variants.forEach((variant: any) => {
          // Handle different possible field names for property values
          const variantPropertyValues = 
            variant.product_variant_property_values || 
            variant.ProductVariantPropertyvalues || 
            variant.ProductVariantPropertyValues || 
            variant.propertyvalues || 
            [];
          
          console.log(`🔍 DEBUG EditProductModal: Processing variant ${variant.productvariantid || variant.ProductVariantID}, has ${variantPropertyValues.length} property values`);
          
          variantPropertyValues.forEach((pvv: any) => {
            // Get property info - could be nested or direct
            const property = pvv.properties || pvv.Property || pvv.property;
            if (!property) {
              console.log('🔍 DEBUG EditProductModal: No property found in pvv:', pvv);
              return;
            }
            
            // Handle different possible field names for property ID
            const propertyId = property.propertyid || property.PropertyID || property.property_id;
            // Handle different possible field names for value
            const value = pvv.value || pvv.Value;
            
            if (propertyId && value) {
              if (!propertyValueMap[propertyId]) {
                propertyValueMap[propertyId] = new Set();
              }
              propertyValueMap[propertyId].add(value);
              console.log(`🔍 DEBUG EditProductModal: Added property "${property.name || propertyId}" value "${value}"`);
            } else {
              console.log('🔍 DEBUG EditProductModal: Missing propertyId or value:', { propertyId, value, property, pvv });
            }
          });
        });
        
        console.log('🔍 DEBUG EditProductModal: Extracted property values from variants:', propertyValueMap);
        
        // If editing existing product, populate selected values from variants
        if (Object.keys(propertyValueMap).length > 0) {
          Object.entries(propertyValueMap).forEach(([propertyId, valueSet]) => {
            const prop = properties.find((p: Property) => p.propertyid === propertyId);
            if (prop) {
              console.log(`🔍 DEBUG EditProductModal: Processing property "${prop.name}" (${prop.propertyid})`);
              
              // For select properties, find the propertyvalueids that match the value strings
              if (prop.datatype === 'select' && propertyValuesMap[prop.propertyid]) {
                const matchingIds: string[] = [];
                valueSet.forEach(valueStr => {
                  const matchingValue = propertyValuesMap[prop.propertyid].find(
                    pv => pv.value === valueStr && pv.isactive
                  );
                  if (matchingValue) {
                    matchingIds.push(matchingValue.propertyvalueid);
                    console.log(`🔍 DEBUG EditProductModal: Matched value "${valueStr}" to ID: ${matchingValue.propertyvalueid}`);
                  } else {
                    console.log(`🔍 DEBUG EditProductModal: ❌ No matching propertyvalueid found for "${valueStr}"`);
                    console.log(`  Available values:`, propertyValuesMap[prop.propertyid].map(pv => ({ id: pv.propertyvalueid, value: pv.value })));
                  }
                });
                if (matchingIds.length > 0) {
                  initialSelected[prop.propertyid] = matchingIds;
                }
              } else {
                // For non-select properties, use the values directly
                initialSelected[prop.propertyid] = Array.from(valueSet);
              }
            } else {
              console.log(`🔍 DEBUG EditProductModal: ❌ Property with ID "${propertyId}" not found in available properties`);
            }
          });
        } else if (product?.propertyValues) {
          // Fallback to old propertyValues format (for backwards compatibility)
          Object.entries(product.propertyValues).forEach(([propName, value]) => {
            console.log(`🔍 DEBUG EditProductModal: Looking for property "${propName}" with value "${value}"`);
            // Find property by name and add value to selection
            const prop = properties.find((p: Property) => p.name.toLowerCase() === propName.toLowerCase());
            if (prop) {
              console.log(`🔍 DEBUG EditProductModal: Found property "${prop.name}" (${prop.propertyid})`);
              
              // For select properties, find the propertyvalueid that matches the value string
              if (prop.datatype === 'select' && propertyValuesMap[prop.propertyid]) {
                const matchingValue = propertyValuesMap[prop.propertyid].find(
                  pv => pv.value === value && pv.isactive
                );
                if (matchingValue) {
                  initialSelected[prop.propertyid] = [matchingValue.propertyvalueid];
                  console.log(`🔍 DEBUG EditProductModal: Matched value "${value}" to ID: ${matchingValue.propertyvalueid}`);
                } else {
                  console.log(`🔍 DEBUG EditProductModal: ❌ No matching propertyvalueid found for "${value}"`);
                  console.log(`  Available values:`, propertyValuesMap[prop.propertyid].map(pv => ({ id: pv.propertyvalueid, value: pv.value })));
                  // Fallback: use the value(s) directly (for non-select or if ID not found)
                  initialSelected[prop.propertyid] = Array.isArray(value) ? value : [value];
                }
              } else {
                // For non-select properties, use the value(s) directly
                initialSelected[prop.propertyid] = Array.isArray(value) ? value : [value];
              }
            } else {
              console.log(`🔍 DEBUG EditProductModal: ❌ Property "${propName}" not found in available properties`);
            }
          });
        }

        console.log('🔍 DEBUG EditProductModal: Initial selected property values:', initialSelected);
        setSelectedPropertyValues(initialSelected);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoadingProperties(false);
    }
  };

  // Handle property value selection (using propertyvalueid)
  const togglePropertyValue = (propertyId: string, propertyValueId: string) => {
    setSelectedPropertyValues(prev => {
      const current = prev[propertyId] || [];
      const isSelected = current.includes(propertyValueId);

      console.log(`🔍 DEBUG EditProductModal: Toggling property "${propertyId}" value ID "${propertyValueId}"`);
      console.log(`  Current selection:`, current);
      console.log(`  Is selected:`, isSelected);

      if (isSelected) {
        const newSelection = current.filter(v => v !== propertyValueId);
        console.log(`  Removing, new selection:`, newSelection);
        return {
          ...prev,
          [propertyId]: newSelection
        };
      } else {
        const newSelection = [...current, propertyValueId];
        console.log(`  Adding, new selection:`, newSelection);
        return {
          ...prev,
          [propertyId]: newSelection
        };
      }
    });
  };

  // Load product types on mount
  useEffect(() => {
    loadProductTypes();
    loadAvailableProducts();
    if (!isNewProduct && product?.id) {
      loadRelatedProducts();
    }
  }, []);

  // Update properties when product type changes
  useEffect(() => {
    if (formData.productTypeID) {
      loadPropertiesForProductType(formData.productTypeID);
    }
  }, [formData.productTypeID]);

  // Load available products for related products dropdown
  const loadAvailableProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const result = await response.json();
      if (response.ok && result.products) {
        // Filter out the current product
        const filtered = result.products.filter((p: Product) => 
          p.id !== product?.id && p.productid !== product?.productid
        );
        setAvailableProducts(filtered);
      }
    } catch (error) {
      console.error('Error loading available products:', error);
    }
  };

  // Load existing related products
  const loadRelatedProducts = async () => {
    if (!product || isNewProduct) return;
    
    try {
      setLoadingRelatedProducts(true);
      const productId = product.id || product.productid;
      const response = await fetch(`/api/products/${productId}/related`);
      const result = await response.json();
      
      if (response.ok && result.products) {
        const ids = result.products.map((p: Product) => p.productid || p.id);
        setRelatedProductIds(ids);
      }
    } catch (error) {
      console.error('Error loading related products:', error);
    } finally {
      setLoadingRelatedProducts(false);
    }
  };

  // Save related products
  const saveRelatedProducts = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/related`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relatedProductIds })
      });
      
      if (!response.ok) {
        console.error('Error saving related products');
      }
    } catch (error) {
      console.error('Error saving related products:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🔍 DEBUG EditProductModal: Submitting form');
    console.log('  Selected property values (IDs):', selectedPropertyValues);
    console.log('  Available properties:', properties);

    // Convert selected property values (IDs) to propertyValues format (value strings)
    const propertyValues: Record<string, string> = {};
    Object.entries(selectedPropertyValues).forEach(([propertyId, valueIds]) => {
      const property = properties.find(p => p.propertyid === propertyId);
      if (property && valueIds.length > 0) {
        // For select properties, find the value string from the propertyvalueid
        if (property.datatype === 'select' && property.values) {
          const matchingValue = property.values.find(pv => pv.propertyvalueid === valueIds[0]);
          if (matchingValue) {
            propertyValues[property.name.toLowerCase()] = matchingValue.value;
            console.log(`  Property "${property.name}": ID ${valueIds[0]} -> value "${matchingValue.value}"`);
          }
        } else {
          // For non-select properties, use the value directly
          propertyValues[property.name.toLowerCase()] = valueIds[0];
        }
      }
    });

    console.log('  Final propertyValues:', propertyValues);

    const productToSave = {
      ...formData,
      propertyValues
    };

    // Save related products for existing products
    if (!isNewProduct && (product?.id || product?.productid)) {
      const productId = String(product.id || product.productid);
      saveRelatedProducts(productId);
    }
    
    onSave(productToSave);
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert(language === 'bg' ? 'Моля изберете снимка (JPG, PNG, etc.)' : 'Please select an image (JPG, PNG, etc.)');
      return;
    }

    // Create temporary preview URL
    const tempPreviewUrl = URL.createObjectURL(file);
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    // Add temporary preview to images immediately
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, tempPreviewUrl]
    }));
    
    // Add to uploading list
    setUploadingImages(prev => [...prev, tempId]);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('folder', 'images');

      console.log('📤 Uploading image:', file.name, file.size, file.type);

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: uploadFormData
      });

      const result = await response.json();
      console.log('📥 Upload response:', result);

      if (response.ok && result.success) {
        // Verify URL is valid
        if (!result.url) {
          console.error('❌ No URL returned from upload:', result);
          setFormData(prev => ({
            ...prev,
            images: prev.images.filter(img => img !== tempPreviewUrl)
          }));
          URL.revokeObjectURL(tempPreviewUrl);
          alert(language === 'bg' 
            ? 'Грешка: URL не е върнат от сървъра' 
            : 'Error: No URL returned from server');
          return;
        }

        // Remove temporary preview and add real URL
        setFormData(prev => {
          const newImages = prev.images
            .filter(img => img !== tempPreviewUrl)
            .concat(result.url);
          
          console.log('📸 Updated images array:', {
            oldCount: prev.images.length,
            newCount: newImages.length,
            newUrl: result.url,
            allUrls: newImages
          });
          
          return {
            ...prev,
            images: newImages
          };
        });
        
        // Revoke temporary URL
        URL.revokeObjectURL(tempPreviewUrl);
        
        console.log('✅ Image uploaded successfully:', {
          url: result.url,
          path: result.path,
          fileName: result.fileName,
          bucket: result.bucket,
          fullUrl: result.url
        });
        
        // Test if image is accessible
        const img = new Image();
        img.onload = () => {
          console.log('✅ Image URL is accessible and loaded:', result.url);
        };
        img.onerror = () => {
          console.warn('⚠️ Image URL may not be accessible:', result.url);
          console.warn('⚠️ Check if bucket is public and CORS is configured');
        };
        img.src = result.url;
      } else {
        // Remove temporary preview on error
        setFormData(prev => ({
          ...prev,
          images: prev.images.filter(img => img !== tempPreviewUrl)
        }));
        URL.revokeObjectURL(tempPreviewUrl);
        
        console.error('❌ Upload failed:', result);
        alert(language === 'bg' 
          ? `Грешка при качване: ${result.error || 'Неуспешно качване'}` 
          : `Upload error: ${result.error || 'Upload failed'}`);
      }
    } catch (error) {
      // Remove temporary preview on error
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter(img => img !== tempPreviewUrl)
      }));
      URL.revokeObjectURL(tempPreviewUrl);
      
      console.error('❌ Upload error:', error);
      alert(language === 'bg' 
        ? 'Грешка при качване на снимка' 
        : 'Error uploading image');
    } finally {
      setUploadingImages(prev => prev.filter(id => id !== tempId));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        handleImageUpload(file);
      });
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        handleImageUpload(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="rounded-xl max-w-4xl w-full my-4 sm:my-8 max-h-[90vh] overflow-y-auto transition-colors duration-300"
        style={{
          backgroundColor: theme.colors.surface,
          boxShadow: theme.effects.shadowHover
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="sticky top-0 border-b px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 flex justify-between items-center transition-colors duration-300 z-10"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border
          }}
        >
          <h2 
            className="text-base sm:text-lg md:text-xl font-semibold transition-colors duration-300 pr-2"
            style={{ color: theme.colors.text }}
          >
            {isNewProduct 
              ? (language === 'bg' ? 'Добави нов продукт' : 'Add New Product')
              : t.editProduct}
          </h2>
          <button 
            onClick={onClose} 
            className="p-1.5 sm:p-2 rounded transition-colors duration-300 flex-shrink-0 touch-manipulation"
            style={{ color: theme.colors.textSecondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.secondary;
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label={t.cancel}
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <h3 
              className="font-medium text-sm sm:text-base transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {t.basicInfo}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
              <div>
                <label 
                  className="block text-xs sm:text-sm font-medium mb-1.5 transition-colors duration-300"
                  style={{ color: theme.colors.text }}
                >
                  {t.categoryLabel}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Product['category'] })}
                  className="w-full px-3 py-2.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300 touch-manipulation"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                >
                  <option value="clothes">{t.clothes}</option>
                  <option value="shoes">{t.shoes}</option>
                  <option value="accessories">{t.accessories}</option>
                </select>
              </div>

              <div>
                <label
                  className="block text-xs sm:text-sm font-medium mb-1.5 transition-colors duration-300"
                  style={{ color: theme.colors.text }}
                >
                  {language === 'bg' ? 'Категория' : 'Category'}
                </label>
                <select
                  value={formData.productTypeID || ''}
                  onChange={(e) => setFormData({ ...formData, productTypeID: e.target.value })}
                  className="w-full px-3 py-2.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300 touch-manipulation"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                >
                  <option value="">
                    {language === 'bg' ? 'Изберете тип' : 'Select type'}
                  </option>
                  {productTypes.map((type) => (
                    <option key={type.producttypeid} value={type.producttypeid}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label 
                  className="block text-xs sm:text-sm font-medium mb-1.5 transition-colors duration-300"
                  style={{ color: theme.colors.text }}
                >
                  {t.brandLabel}
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                />
              </div>
            </div>

            <div>
              <label 
                className="block text-xs sm:text-sm font-medium mb-1.5 transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {t.modelLabel}
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>

            <div>
              <label 
                className="block text-xs sm:text-sm font-medium mb-1.5 transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {t.productSubtitle}
                <span className="text-xs ml-1" style={{ color: theme.colors.textSecondary }}>
                  ({language === 'bg' ? 'напр. тесен, свободен крой' : 'e.g., close fit, loose fit'})
                </span>
              </label>
              <input
                type="text"
                value={formData.subtitle || ''}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder={language === 'bg' ? 'Тесен крой' : 'Close fit'}
                className="w-full px-3 py-2.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>

            {formData.category === 'clothes' && (
              <div>
                <label 
                  className="block text-xs sm:text-sm font-medium mb-1.5 transition-colors duration-300"
                  style={{ color: theme.colors.text }}
                >
                  {t.typeLabel}
                </label>
                <input
                  type="text"
                  value={formData.type || ''}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder={t.typePlaceholder}
                  className="w-full px-3 py-2.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h3 
              className="font-medium text-sm sm:text-base transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {t.attributes}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
              <div>
                <label 
                  className="block text-xs sm:text-sm font-medium mb-1.5 transition-colors duration-300"
                  style={{ color: theme.colors.text }}
                >
                  {t.colorLabel}
                </label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-3 py-2.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                />
              </div>

              <div>
                <label 
                  className="block text-xs sm:text-sm font-medium mb-1.5 transition-colors duration-300"
                  style={{ color: theme.colors.text }}
                >
                  {t.sizeLabel}
                </label>
                <input
                  type="text"
                  value={formData.size || ''}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-3 py-2.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                />
              </div>
            </div>

            <div>
              <label 
                className="block text-xs sm:text-sm font-medium mb-1.5 transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {t.quantityLabel}
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>
          </div>

          <div>
            <h3 
              className="font-medium mb-2.5 sm:mb-3 md:mb-4 text-sm sm:text-base transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {t.pricing}
            </h3>
            <div>
              <label 
                className="block text-xs sm:text-sm font-medium mb-1.5 transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {t.priceLabel}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>
          </div>

          {/* Property Values Section */}
          {properties.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              <h3
                className="font-medium text-sm sm:text-base transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {language === 'bg' ? 'Характеристики' : 'Properties'}
              </h3>

              {loadingProperties ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={20} className="animate-spin" style={{ color: theme.colors.primary }} />
                  <span className="ml-2 text-sm" style={{ color: theme.colors.textSecondary }}>
                    {language === 'bg' ? 'Зареждане...' : 'Loading...'}
                  </span>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {properties.map((property) => (
                    <div key={property.propertyid}>
                      <label
                        className="block text-xs sm:text-sm font-medium mb-2 transition-colors duration-300"
                        style={{ color: theme.colors.text }}
                      >
                        {property.name}
                        {property.description && (
                          <span className="text-xs ml-1" style={{ color: theme.colors.textSecondary }}>
                            ({property.description})
                          </span>
                        )}
                      </label>

                      {property.datatype === 'select' && property.values ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {property.values
                            .filter(value => value.isactive)
                            .sort((a, b) => a.displayorder - b.displayorder)
                            .map((value) => {
                              const isSelected = selectedPropertyValues[property.propertyid]?.includes(value.propertyvalueid) || false;
                              return (
                                <button
                                  key={value.propertyvalueid}
                                  type="button"
                                  onClick={() => togglePropertyValue(property.propertyid, value.propertyvalueid)}
                                  className={`px-3 py-2 text-sm border rounded-lg transition-all duration-300 flex items-center justify-center gap-2 touch-manipulation ${
                                    isSelected
                                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                  }`}
                                  style={{
                                    backgroundColor: isSelected ? 'transparent' : theme.colors.cardBg,
                                    color: theme.colors.text
                                  }}
                                >
                                  {isSelected && <Check size={14} />}
                                  <span>{value.value}</span>
                                </button>
                              );
                            })}
                        </div>
                      ) : (
                        <input
                          type={property.datatype === 'number' ? 'number' : 'text'}
                          value={selectedPropertyValues[property.propertyid]?.[0] || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setSelectedPropertyValues(prev => ({
                              ...prev,
                              [property.propertyid]: value ? [value] : []
                            }));
                          }}
                          placeholder={language === 'bg' ? `Въведете ${property.name.toLowerCase()}` : `Enter ${property.name.toLowerCase()}`}
                          className="w-full px-3 py-2.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                          style={{
                            backgroundColor: theme.colors.cardBg,
                            borderColor: theme.colors.border,
                            color: theme.colors.text
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DEBUG INFO */}
          {properties.length > 0 && (
            <div className="mt-4 p-4 border-2 border-yellow-500 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
              <h4 className="font-bold text-sm mb-2">🔍 DEBUG INFO - EditProductModal</h4>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <strong>Product Data:</strong>
                  <pre className="mt-1 p-2 bg-white dark:bg-gray-800 rounded overflow-auto max-h-40">
                    {JSON.stringify({
                      id: product?.id,
                      brand: product?.brand,
                      model: product?.model,
                      productTypeID: product?.productTypeID || formData.productTypeID,
                      propertyValues: product?.propertyValues
                    }, null, 2)}
                  </pre>
                </div>
                <div>
                  <strong>Available Properties:</strong>
                  <pre className="mt-1 p-2 bg-white dark:bg-gray-800 rounded overflow-auto max-h-40">
                    {JSON.stringify(
                      properties.map(p => ({
                        propertyid: p.propertyid,
                        name: p.name,
                        datatype: p.datatype,
                        valuesCount: p.values?.length || 0,
                        values: p.values?.map(v => ({
                          propertyvalueid: v.propertyvalueid,
                          value: v.value,
                          isactive: v.isactive
                        })) || []
                      })),
                      null,
                      2
                    )}
                  </pre>
                </div>
                <div>
                  <strong>Selected Property Values (IDs):</strong>
                  <pre className="mt-1 p-2 bg-white dark:bg-gray-800 rounded overflow-auto max-h-40">
                    {JSON.stringify(selectedPropertyValues, null, 2)}
                  </pre>
                </div>
                <div>
                  <strong>Selected Property Values (Mapped to Names):</strong>
                  <pre className="mt-1 p-2 bg-white dark:bg-gray-800 rounded overflow-auto max-h-40">
                    {JSON.stringify(
                      Object.entries(selectedPropertyValues).reduce((acc, [propId, valueIds]) => {
                        const prop = properties.find(p => p.propertyid === propId);
                        if (prop) {
                          const valueNames = valueIds.map(id => {
                            const value = prop.values?.find(v => v.propertyvalueid === id);
                            return value ? value.value : id;
                          });
                          acc[prop.name] = valueNames;
                        }
                        return acc;
                      }, {} as Record<string, string[]>),
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            <h3
              className="font-medium text-sm sm:text-base transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {language === 'bg' ? 'Снимки' : 'Images'}
            </h3>
            
            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-3 sm:p-4 md:p-6 transition-all duration-300 ${
                dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              style={{
                borderColor: dragActive ? theme.colors.primary : theme.colors.border,
                backgroundColor: dragActive ? 'transparent' : theme.colors.cardBg
              }}
            >
              <div className="flex flex-col items-center justify-center text-center">
                <ImageIcon 
                  size={32}
                  className="sm:w-10 sm:h-10 mb-2"
                  style={{ color: theme.colors.textSecondary }}
                />
                <p 
                  className="text-xs sm:text-sm mb-2.5 sm:mb-3 transition-colors duration-300 px-2"
                  style={{ color: theme.colors.text }}
                >
                  {language === 'bg' 
                    ? 'Плъзнете снимки тук или кликнете за избор' 
                    : 'Drag images here or click to select'}
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-300 flex items-center gap-1.5 sm:gap-2 touch-manipulation"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: '#fff'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <Upload size={14} className="sm:w-4 sm:h-4" />
                  <span>{language === 'bg' ? 'Избери снимки' : 'Select Images'}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                />
                <p 
                  className="text-xs mt-2 transition-colors duration-300"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {language === 'bg' 
                    ? 'JPG, PNG, GIF до 10MB' 
                    : 'JPG, PNG, GIF up to 10MB'}
                </p>
              </div>
            </div>

            {/* Image Preview Grid */}
            {formData.images.length > 0 && (
              <div className="space-y-2">
                <p 
                  className="text-xs transition-colors duration-300"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {language === 'bg' 
                    ? `Качени снимки: ${formData.images.length}` 
                    : `Uploaded images: ${formData.images.length}`}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                  {formData.images.map((image, index) => {
                    const isUploading = uploadingImages.some(id => 
                      formData.images.indexOf(image) === formData.images.length - 1
                    );
                    return (
                      <div
                        key={`${image}-${index}`}
                        className="relative group aspect-square rounded-lg overflow-hidden border transition-colors duration-300 min-w-0 flex-shrink-0"
                        style={{ borderColor: theme.colors.border }}
                      >
                        {isUploading ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                            <Loader2 size={20} className="sm:w-6 sm:h-6 animate-spin" style={{ color: theme.colors.primary }} />
                          </div>
                        ) : (
                          <>
                            <img
                              src={image}
                              alt={`Product image ${index + 1}`}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                console.error('❌ Image failed to load:', {
                                  url: image,
                                  index,
                                  allImages: formData.images
                                });
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'w-full h-full flex flex-col items-center justify-center bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs p-2 text-center';
                                errorDiv.innerHTML = `
                                  <div>${language === 'bg' ? 'Грешка при зареждане' : 'Load error'}</div>
                                  <div class="text-[10px] mt-1 break-all">${image.substring(0, 30)}...</div>
                                `;
                                target.parentElement?.appendChild(errorDiv);
                              }}
                              onLoad={() => {
                                console.log('✅ Image loaded successfully:', {
                                  url: image,
                                  index
                                });
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 p-1.5 sm:p-2 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 active:opacity-100 transition-opacity duration-300 touch-manipulation z-10"
                              aria-label={language === 'bg' ? 'Премахни снимка' : 'Remove image'}
                              onTouchStart={(e) => {
                                e.currentTarget.style.opacity = '1';
                              }}
                            >
                              <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 
              className="font-medium mb-3 sm:mb-4 text-sm sm:text-base transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {t.visibility}
            </h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.visible}
                onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded focus:ring-2 transition-colors duration-300"
                style={{
                  accentColor: theme.colors.primary
                }}
              />
              <span
                className="text-xs sm:text-sm transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {t.visibleOnWebsite}
              </span>
            </label>
          </div>

          <div>
            <h3
              className="font-medium mb-3 sm:mb-4 text-sm sm:text-base transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {language === 'bg' ? 'Избран продукт' : 'Featured Product'}
            </h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isfeatured || false}
                onChange={(e) => setFormData({ ...formData, isfeatured: e.target.checked })}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded focus:ring-2 transition-colors duration-300"
                style={{
                  accentColor: theme.colors.primary
                }}
              />
              <span
                className="text-xs sm:text-sm transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {language === 'bg'
                  ? 'Показва се на началната страница'
                  : 'Displayed on home page'
                }
              </span>
            </label>
            <p className="text-xs transition-colors duration-300 mt-1 ml-8"
               style={{ color: theme.colors.textSecondary }}>
              {language === 'bg'
                ? 'Максимум 4 избрани продукта ще се покажат на началната страница'
                : 'Maximum 4 featured products will be displayed on the home page'
              }
            </p>
          </div>

          {/* Related Products Section (Only for existing products) */}
          {!isNewProduct && (
            <div className="space-y-3 sm:space-y-4">
              <h3
                className="font-medium text-sm sm:text-base transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {t.relatedProducts} ({t.youMightLike})
              </h3>
              
              <p 
                className="text-xs transition-colors duration-300"
                style={{ color: theme.colors.textSecondary }}
              >
                {language === 'bg'
                  ? 'Изберете продукти, които да се показват в секцията "Може да харесате" на страницата на продукта.'
                  : 'Select products to display in the "You might like" section on the product page.'
                }
              </p>

              {loadingRelatedProducts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin" size={24} style={{ color: theme.colors.primary }} />
                </div>
              ) : (
                <div className="space-y-2">
                  {availableProducts.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto border rounded-lg p-3"
                         style={{ borderColor: theme.colors.border }}>
                      {availableProducts.map((availableProduct) => {
                        const productId = availableProduct.productid || availableProduct.id;
                        const isSelected = relatedProductIds.includes(String(productId));
                        
                        return (
                          <label
                            key={productId}
                            className="flex items-center gap-3 p-2 rounded hover:bg-opacity-50 cursor-pointer transition-colors"
                            style={{ 
                              backgroundColor: isSelected ? theme.colors.surface : 'transparent'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const productIdStr = String(productId);
                                if (e.target.checked) {
                                  setRelatedProductIds(prev => [...prev, productIdStr]);
                                } else {
                                  setRelatedProductIds(prev => prev.filter(id => id !== productIdStr));
                                }
                              }}
                              className="w-4 h-4 rounded"
                            />
                            <div className="flex items-center gap-3 flex-1">
                              {availableProduct.images && availableProduct.images[0] && (
                                <img
                                  src={availableProduct.images[0]}
                                  alt={`${availableProduct.brand} ${availableProduct.model}`}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <p 
                                  className="text-sm font-medium"
                                  style={{ color: theme.colors.text }}
                                >
                                  {availableProduct.brand} {availableProduct.model}
                                </p>
                                <p 
                                  className="text-xs"
                                  style={{ color: theme.colors.textSecondary }}
                                >
                                  €{availableProduct.price?.toFixed(2) || '0.00'}
                                </p>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p 
                      className="text-sm py-4 text-center"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {language === 'bg' ? 'Няма налични продукти' : 'No available products'}
                    </p>
                  )}
                  
                  {relatedProductIds.length > 0 && (
                    <p 
                      className="text-xs"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {relatedProductIds.length} {language === 'bg' ? 'избрани продукта' : 'products selected'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div 
            className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t transition-colors duration-300 sticky bottom-0 bg-inherit"
            style={{ borderColor: theme.colors.border }}
          >
            <button
              type="submit"
              className="flex-1 text-white px-4 sm:px-5 md:px-6 py-2.5 sm:py-2 md:py-2.5 rounded-lg font-medium text-sm sm:text-base transition-all duration-300 touch-manipulation"
              style={{
                backgroundColor: typeof theme.colors.buttonPrimary === 'string' && !theme.colors.buttonPrimary.includes('gradient')
                  ? theme.colors.buttonPrimary
                  : undefined,
                backgroundImage: typeof theme.colors.buttonPrimary === 'string' && theme.colors.buttonPrimary.includes('gradient') 
                  ? theme.colors.buttonPrimary 
                  : undefined
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                if (typeof theme.colors.buttonPrimary === 'string' && !theme.colors.buttonPrimary.includes('gradient')) {
                  e.currentTarget.style.backgroundColor = theme.colors.buttonPrimaryHover;
                  e.currentTarget.style.backgroundImage = 'none';
                } else {
                  e.currentTarget.style.backgroundImage = theme.colors.buttonPrimaryHover;
                }
              }}
              onMouseLeave={(e) => {
                if (typeof theme.colors.buttonPrimary === 'string' && !theme.colors.buttonPrimary.includes('gradient')) {
                  e.currentTarget.style.backgroundColor = theme.colors.buttonPrimary;
                  e.currentTarget.style.backgroundImage = 'none';
                } else {
                  e.currentTarget.style.backgroundImage = theme.colors.buttonPrimary;
                }
              }}
              onTouchStart={(e) => {
                if (typeof theme.colors.buttonPrimary === 'string' && !theme.colors.buttonPrimary.includes('gradient')) {
                  e.currentTarget.style.backgroundColor = theme.colors.buttonPrimaryHover;
                }
              }}
            >
              {t.saveChanges}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-2 md:py-2.5 rounded-lg text-sm sm:text-base transition-colors duration-300 touch-manipulation"
              style={{ 
                color: theme.colors.text,
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.secondary;
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {t.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

