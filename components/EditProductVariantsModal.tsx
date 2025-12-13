'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Image as ImageIcon, Upload, Save, Package, Settings, List } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useProductTypes } from '@/context/ProductTypeContext';
import { useProperties } from '@/context/PropertiesContext';
import { translations } from '@/lib/translations';
import { ProductWithDetails, ProductVariantWithDetails, Property, PropertyValue, ProductImage } from '@/lib/types/product-types';

interface EditProductVariantsModalProps {
  product: ProductWithDetails | null;
  onClose: () => void;
  onSave: (productData: any) => void;
}

interface VariantFormData {
  productvariantid?: string;
  sku?: string;
  price?: number;
  compareatprice?: number;
  cost?: number;
  quantity: number;
  weight?: number;
  weightunit: string;
  barcode?: string;
  trackquantity: boolean;
  continuesellingwhenoutofstock: boolean;
  isvisible: boolean;
  propertyvalues: Record<string, string>;
}

export default function EditProductVariantsModal({ product, onClose, onSave }: EditProductVariantsModalProps) {
  const isNewProduct = !product;
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { productTypes } = useProductTypes();
  const { properties } = useProperties();
  const t = translations[language];

  // Form state
  const [productForm, setProductForm] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    description: product?.description || '',
    producttypeid: product?.producttypeid || ''
  });

  const [variants, setVariants] = useState<VariantFormData[]>(
    product?.variants?.map(v => ({
      productvariantid: v.productvariantid,
      sku: v.sku || '',
      price: v.price || 0,
      compareatprice: v.compareatprice || undefined,
      cost: v.cost || undefined,
      quantity: v.quantity,
      weight: v.weight || undefined,
      weightunit: v.weightunit || 'kg',
      barcode: v.barcode || '',
      trackquantity: v.trackquantity,
      continuesellingwhenoutofstock: v.continuesellingwhenoutofstock,
      isvisible: v.isvisible,
      propertyvalues: v.propertyvalues?.reduce((acc, pv) => {
        if (pv.property) {
          acc[pv.property.propertyid] = pv.value;
        }
        return acc;
      }, {} as Record<string, string>) || {}
    })) || []
  );

  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [propertyValues, setPropertyValues] = useState<Record<string, PropertyValue[]>>({});
  const [selectedPropertyValues, setSelectedPropertyValues] = useState<Record<string, string[]>>({});
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);
  const [variantForm, setVariantForm] = useState<VariantFormData>({
    quantity: 0,
    weightunit: 'kg',
    trackquantity: true,
    continuesellingwhenoutofstock: false,
    isvisible: true,
    propertyvalues: {}
  });

  // Get available properties for selected product type
  useEffect(() => {
    if (productForm.producttypeid) {
      const productType = productTypes.find(pt => pt.producttypeid === productForm.producttypeid);
      if (productType) {
        // Fetch properties for this product type
        fetch(`/api/product-types/${productForm.producttypeid}/properties`)
          .then(res => res.json())
          .then(result => {
            if (result.success) {
              const properties = result.properties || [];
              setAvailableProperties(properties);

              // Load property values for select-type properties
              const loadPropertyValues = async () => {
                const values: Record<string, PropertyValue[]> = {};
                for (const property of properties) {
                  if (property.DataType === 'select') {
                    try {
                      const response = await fetch(`/api/properties/${property.PropertyID}/values`);
                      const result = await response.json();
                      if (result.success) {
                        values[property.PropertyID] = result.values || [];
                      }
                    } catch (error) {
                      console.error(`Failed to load values for property ${property.PropertyID}:`, error);
                    }
                  }
                }
                setPropertyValues(values);
              };

              loadPropertyValues();
            }
          })
          .catch(console.error);
      }
    } else {
      setAvailableProperties([]);
      setPropertyValues({});
    }
  }, [productForm.producttypeid, productTypes]);

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      ...productForm,
      SelectedPropertyValues: selectedPropertyValues,
      Variants: variants.map(v => ({
        ...v,
        // Convert property values to the expected format
        propertyvalues: Object.entries(v.propertyvalues).map(([propertyId, value]) => ({
          propertyid: propertyId,
          value: value
        }))
      }))
    };

    onSave(productData);
  };

  const addVariant = () => {
    setVariantForm({
      quantity: 0,
      weightunit: 'kg',
      trackquantity: true,
      continuesellingwhenoutofstock: false,
      isvisible: true,
      propertyvalues: {}
    });
    setEditingVariantIndex(null);
    setShowVariantModal(true);
  };

  const editVariant = (index: number) => {
    setVariantForm(variants[index]);
    setEditingVariantIndex(index);
    setShowVariantModal(true);
  };

  const saveVariant = () => {
    if (editingVariantIndex !== null) {
      // Update existing variant
      const updatedVariants = [...variants];
      updatedVariants[editingVariantIndex] = { ...variantForm };
      setVariants(updatedVariants);
    } else {
      // Add new variant
      setVariants([...variants, { ...variantForm }]);
    }
    setShowVariantModal(false);
  };

  const deleteVariant = (index: number) => {
    const updatedVariants = variants.filter((_, i) => i !== index);
    setVariants(updatedVariants);
  };

  const togglePropertyValueSelection = (propertyId: string, valueId: string) => {
    setSelectedPropertyValues(prev => {
      const current = prev[propertyId] || [];
      const isSelected = current.includes(valueId);

      if (isSelected) {
        return {
          ...prev,
          [propertyId]: current.filter(id => id !== valueId)
        };
      } else {
        return {
          ...prev,
          [propertyId]: [...current, valueId]
        };
      }
    });
  };

  const isPropertyValueSelected = (propertyId: string, valueId: string) => {
    return (selectedPropertyValues[propertyId] || []).includes(valueId);
  };

  const generateVariantCombinations = () => {
    // This would generate all possible combinations of properties
    // For now, we'll keep it simple and let users add variants manually
    alert(language === 'bg'
      ? 'Функцията за автоматично генериране на варианти ще бъде добавена скоро'
      : 'Auto-generate variants feature will be added soon'
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-lg shadow-xl"
        style={{
          backgroundColor: theme.colors.surface,
          color: theme.colors.text
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: theme.colors.border }}
        >
          <h2 className="text-2xl font-bold">
            {isNewProduct
              ? (language === 'bg' ? 'Добави продукт' : 'Add Product')
              : (language === 'bg' ? 'Редактирай продукт' : 'Edit Product')
            }
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleProductSubmit} className="flex flex-col h-[calc(90vh-80px)]">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Product Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package size={20} />
                {language === 'bg' ? 'Основна информация' : 'Basic Information'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'bg' ? 'Име на продукта' : 'Product Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                    style={{
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      color: theme.colors.text
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'bg' ? 'Тип продукт' : 'Product Type'} *
                  </label>
                  <select
                    required
                    value={productForm.producttypeid}
                    onChange={(e) => setProductForm(prev => ({ ...prev, producttypeid: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                    style={{
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      color: theme.colors.text
                    }}
                  >
                    <option value="">
                      {language === 'bg' ? 'Изберете тип' : 'Select Type'}
                    </option>
                    {productTypes.map(type => (
                      <option key={type.producttypeid} value={type.producttypeid}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                    style={{
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      color: theme.colors.text
                    }}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    {language === 'bg' ? 'Описание' : 'Description'}
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                    style={{
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      color: theme.colors.text
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Variants Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Settings size={20} />
                  {language === 'bg' ? 'Варианти на продукта' : 'Product Variants'}
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={generateVariantCombinations}
                    className="px-4 py-2 text-sm border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    style={{
                      borderColor: theme.colors.border,
                      color: theme.colors.text
                    }}
                  >
                    {language === 'bg' ? 'Генерирай варианти' : 'Generate Variants'}
                  </button>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    {language === 'bg' ? 'Добави вариант' : 'Add Variant'}
                  </button>
                </div>
              </div>

              {/* Variants List */}
              <div className="space-y-3">
                {variants.length === 0 ? (
                  <div
                    className="text-center py-8 border-2 border-dashed rounded-lg"
                    style={{ borderColor: theme.colors.border }}
                  >
                    <Package size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">
                      {language === 'bg' ? 'Няма варианти' : 'No variants yet'}
                    </p>
                    <p className="text-sm opacity-75 mt-2">
                      {language === 'bg'
                        ? 'Добавете варианти за да управлявате различни комбинации от свойства'
                        : 'Add variants to manage different property combinations'
                      }
                    </p>
                  </div>
                ) : (
                  variants.map((variant, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg"
                      style={{
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <span className="font-medium">
                              {variant.sku || `${language === 'bg' ? 'Вариант' : 'Variant'} ${index + 1}`}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                variant.isvisible
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                              }`}
                            >
                              {variant.isvisible
                                ? (language === 'bg' ? 'Видим' : 'Visible')
                                : (language === 'bg' ? 'Скрит' : 'Hidden')
                              }
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <span>
                              {language === 'bg' ? 'Количество:' : 'Qty:'} {variant.quantity}
                            </span>
                            {variant.price && (
                              <span>
                                {language === 'bg' ? 'Цена:' : 'Price:'} ${variant.price}
                              </span>
                            )}
                            {Object.keys(variant.propertyvalues).length > 0 && (
                              <span>
                                {language === 'bg' ? 'Свойства:' : 'Properties:'} {Object.keys(variant.propertyvalues).length}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => editVariant(index)}
                            className="px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            style={{
                              borderColor: theme.colors.border,
                              color: theme.colors.text
                            }}
                          >
                            {language === 'bg' ? 'Редактирай' : 'Edit'}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteVariant(index)}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            {language === 'bg' ? 'Изтрий' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-3 p-6 border-t"
            style={{ borderColor: theme.colors.border }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              style={{
                borderColor: theme.colors.border,
                color: theme.colors.text
              }}
            >
              {language === 'bg' ? 'Отказ' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Save size={16} />
              {language === 'bg' ? 'Запази' : 'Save'}
            </button>
          </div>

          {/* Property Values Selection */}
          {availableProperties.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <List size={20} />
                {language === 'bg' ? 'Налични стойности на свойствата' : 'Available Property Values'}
              </h3>
              <p className="text-sm opacity-75">
                {language === 'bg'
                  ? 'Изберете кои стойности на свойствата са налични за този продукт'
                  : 'Select which property values are available for this product'
                }
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableProperties
                  .filter(prop => prop.datatype === 'select')
                  .map(property => {
                    const availableValues = propertyValues[property.propertyid] || [];

                    return (
                      <div key={property.propertyid} className="space-y-3">
                        <h4 className="font-medium">{property.name}</h4>

                        {availableValues.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">
                            {language === 'bg' ? 'Няма налични стойности' : 'No values available'}
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-3"
                               style={{ borderColor: theme.colors.border }}>
                            {availableValues.map(value => {
                              const isSelected = isPropertyValueSelected(property.propertyid, value.propertyvalueid);

                              return (
                                <label key={value.propertyvalueid} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => togglePropertyValueSelection(property.propertyid, value.propertyvalueid)}
                                    className="rounded"
                                  />
                                  <span className="text-sm">{value.value}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        <div className="text-xs opacity-75">
                          {language === 'bg' ? 'Избрани:' : 'Selected:'} {(selectedPropertyValues[property.propertyid] || []).length} / {availableValues.length}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {availableProperties.filter(prop => prop.datatype === 'select').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {language === 'bg'
                    ? 'Няма select свойства за този тип продукт'
                    : 'No select properties for this product type'
                  }
                </div>
              )}
            </div>
          )}

        </form>

        {/* Variant Modal */}
        {showVariantModal && (
          <VariantModal
            variant={variantForm}
            onChange={setVariantForm}
            onSave={saveVariant}
            onClose={() => setShowVariantModal(false)}
            availableProperties={availableProperties}
            propertyValues={propertyValues}
            selectedPropertyValues={selectedPropertyValues}
          />
        )}
      </div>
    </div>
  );
}

// Variant Modal Component
interface VariantModalProps {
  variant: VariantFormData;
  onChange: (variant: VariantFormData) => void;
  onSave: () => void;
  onClose: () => void;
  availableProperties: Property[];
}

function VariantModal({
  variant,
  onChange,
  onSave,
  onClose,
  availableProperties,
  propertyValues,
  selectedPropertyValues
}: VariantModalProps & {
  propertyValues: Record<string, PropertyValue[]>;
  selectedPropertyValues: Record<string, string[]>;
}) {
  const { language } = useLanguage();
  const { theme } = useTheme();

  const updateVariant = (field: keyof VariantFormData, value: any) => {
    onChange({ ...variant, [field]: value });
  };

  const updatePropertyValue = (propertyId: string, value: string) => {
    onChange({
      ...variant,
      propertyvalues: {
        ...variant.propertyvalues,
        [propertyId]: value
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-lg shadow-xl"
        style={{
          backgroundColor: theme.colors.surface,
          color: theme.colors.text
        }}
      >
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: theme.colors.border }}
        >
          <h3 className="text-xl font-bold">
            {language === 'bg' ? 'Редактирай вариант' : 'Edit Variant'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">SKU</label>
              <input
                type="text"
                value={variant.sku || ''}
                onChange={(e) => updateVariant('sku', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {language === 'bg' ? 'Количество' : 'Quantity'} *
              </label>
              <input
                type="number"
                required
                min="0"
                value={variant.quantity}
                onChange={(e) => updateVariant('quantity', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-md"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {language === 'bg' ? 'Цена' : 'Price'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={variant.price || ''}
                onChange={(e) => updateVariant('price', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-3 py-2 border rounded-md"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {language === 'bg' ? 'Сравнителна цена' : 'Compare at Price'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={variant.compareatprice || ''}
                onChange={(e) => updateVariant('compareatprice', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-3 py-2 border rounded-md"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>
          </div>

          {/* Properties */}
          {availableProperties.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">
                {language === 'bg' ? 'Свойства на варианта' : 'Variant Properties'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableProperties.map(property => {
                  const availableValues = propertyValues[property.propertyid] || [];

                  return (
                    <div key={property.propertyid}>
                      <label className="block text-sm font-medium mb-1">
                        {property.name}
                      </label>

                      {property.datatype === 'select' ? (
                        <select
                          value={variant.propertyvalues[property.propertyid] || ''}
                          onChange={(e) => updatePropertyValue(property.propertyid, e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                          style={{
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.border,
                            color: theme.colors.text
                          }}
                        >
                          <option value="">
                            {language === 'bg' ? 'Изберете...' : 'Select...'}
                          </option>
                          {availableValues
                            .filter(value => {
                              const selectedIds = selectedPropertyValues[property.propertyid] || [];
                              return selectedIds.includes(value.propertyvalueid);
                            })
                            .map(value => (
                              <option key={value.propertyvalueid} value={value.value}>
                                {value.value}
                              </option>
                            ))}
                        </select>
                      ) : (
                        <input
                          type={property.datatype === 'number' ? 'number' : 'text'}
                          value={variant.propertyvalues[property.propertyid] || ''}
                          onChange={(e) => updatePropertyValue(property.propertyid, e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                          style={{
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.border,
                            color: theme.colors.text
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="trackQuantity"
                checked={variant.trackquantity}
                onChange={(e) => updateVariant('trackquantity', e.target.checked)}
              />
              <label htmlFor="trackQuantity" className="text-sm">
                {language === 'bg' ? 'Проследявай количеството' : 'Track quantity'}
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="continueSelling"
                checked={variant.continuesellingwhenoutofstock}
                onChange={(e) => updateVariant('continuesellingwhenoutofstock', e.target.checked)}
              />
              <label htmlFor="continueSelling" className="text-sm">
                {language === 'bg' ? 'Продължавай да продаваш когато свърши' : 'Continue selling when out of stock'}
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isVisible"
                checked={variant.isvisible}
                onChange={(e) => updateVariant('isvisible', e.target.checked)}
              />
              <label htmlFor="isVisible" className="text-sm">
                {language === 'bg' ? 'Видим' : 'Visible'}
              </label>
            </div>
          </div>
        </div>

        <div
          className="flex items-center justify-end gap-3 p-6 border-t"
          style={{ borderColor: theme.colors.border }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            style={{
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
          >
            {language === 'bg' ? 'Отказ' : 'Cancel'}
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            {language === 'bg' ? 'Запази вариант' : 'Save Variant'}
          </button>
        </div>
      </div>
    </div>
  );
}
