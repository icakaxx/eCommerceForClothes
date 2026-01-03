// components/AddToCartModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { Product } from '@/lib/data';
import { translations } from '@/lib/translations';

interface AddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

const AddToCartModal: React.FC<AddToCartModalProps> = ({ isOpen, onClose, product }) => {
  const { language } = useLanguage();
  const { addItem, openCart } = useCart();
  const t = translations[language || 'en'];

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [availableOptions, setAvailableOptions] = useState<Record<string, Set<string>>>({});
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Extract available properties from product variants
  useEffect(() => {
    if (isOpen && product) {
      const productVariants = product.variants || product.Variants || [];
      
      if (Array.isArray(productVariants) && productVariants.length > 0) {
        const visibleVariants = productVariants.filter((v: any) => v.isvisible !== false);
        
        // Build available options map from all variants
        const optionsMap: Record<string, Set<string>> = {};
        visibleVariants.forEach((variant: any) => {
          // Try multiple naming conventions for property values
          const propertyValues = variant.ProductVariantPropertyvalues || 
                                variant.ProductVariantPropertyValues || 
                                variant.product_variant_property_values ||
                                variant.productVariantPropertyvalues ||
                                [];
          
          propertyValues.forEach((pv: any) => {
            // Try multiple naming conventions for property name
            const propertyName = (pv.Property?.name || 
                                 pv.Property?.Name || 
                                 pv.properties?.name ||
                                 pv.properties?.Name ||
                                 pv.propertyid || 
                                 '').toLowerCase();
            // Try multiple naming conventions for property value
            const propertyValue = pv.value || pv.Value || '';
            
            if (propertyName && propertyValue) {
              if (!optionsMap[propertyName]) {
                optionsMap[propertyName] = new Set();
              }
              optionsMap[propertyName].add(propertyValue);
            }
          });
        });
        
        setAvailableOptions(optionsMap);
        
        // Select first variant by default and set initial options
        if (visibleVariants.length > 0) {
          const primaryVariant = visibleVariants.find((v: any) => v.IsPrimaryImage) || visibleVariants[0];
          setSelectedVariant(primaryVariant);
          
          const initialOptions: Record<string, string> = {};
          const primaryPropertyValues = primaryVariant.ProductVariantPropertyvalues || 
                                       primaryVariant.ProductVariantPropertyValues || 
                                       primaryVariant.product_variant_property_values ||
                                       primaryVariant.productVariantPropertyvalues ||
                                       [];
          primaryPropertyValues.forEach((pv: any) => {
            const propertyName = (pv.Property?.name || 
                                 pv.Property?.Name || 
                                 pv.properties?.name ||
                                 pv.properties?.Name ||
                                 pv.propertyid || 
                                 '').toLowerCase();
            const propertyValue = pv.value || pv.Value || '';
            
            if (propertyName && propertyValue) {
              initialOptions[propertyName] = propertyValue;
            }
          });
          setSelectedOptions(initialOptions);
        }
      } else {
        // No variants, clear everything
        setAvailableOptions({});
        setSelectedOptions({});
        setSelectedVariant(null);
      }
      
      setQuantity(1);
      setErrors({});
    }
  }, [isOpen, product]);

  const handleOptionChange = (propertyName: string, value: string) => {
    const newOptions = { ...selectedOptions, [propertyName]: value };
    setSelectedOptions(newOptions);

    // Find matching variant based on all selected options
    const productVariants = product.variants || product.Variants || [];
    const visibleVariants = productVariants.filter((v: any) => v.isvisible !== false);
    
    const matchingVariant = visibleVariants.find((variant: any) => {
      const propertyValues = variant.ProductVariantPropertyvalues || 
                            variant.ProductVariantPropertyValues || 
                            variant.product_variant_property_values ||
                            variant.productVariantPropertyvalues ||
                            [];
      if (propertyValues.length === 0) return false;

      const variantOptions: Record<string, string> = {};
      propertyValues.forEach((pv: any) => {
        const propName = (pv.Property?.name || 
                         pv.Property?.Name || 
                         pv.properties?.name ||
                         pv.properties?.Name ||
                         pv.propertyid || 
                         '').toLowerCase();
        const propValue = pv.value || pv.Value || '';
        
        if (propName && propValue) {
          variantOptions[propName] = propValue;
        }
      });

      // Check if all selected options match this variant
      return Object.keys(newOptions).every(
        (key) => variantOptions[key] === newOptions[key]
      );
    });

    if (matchingVariant) {
      setSelectedVariant(matchingVariant);
    }
  };

  const handleQuantityChange = (delta: number) => {
    const maxQuantity = selectedVariant?.quantity || product.quantity || 0;
    const newQuantity = Math.max(1, Math.min(maxQuantity, quantity + delta));
    setQuantity(newQuantity);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate that all available properties are selected
    Object.keys(availableOptions).forEach((propertyName) => {
      if (!selectedOptions[propertyName]) {
        if (propertyName === 'size') {
          newErrors[propertyName] = t.pleaseSelectSize;
        } else {
          const propertyLabel = propertyName === 'colour' || propertyName === 'color' ? t.color :
                               propertyName.charAt(0).toUpperCase() + propertyName.slice(1);
          newErrors[propertyName] = language === 'bg' 
            ? `Моля, изберете ${propertyLabel.toLowerCase()}`
            : `Please select ${propertyLabel.toLowerCase()}`;
        }
      }
    });

    const maxQuantity = selectedVariant?.quantity || product.quantity || 0;
    if (quantity > maxQuantity) {
      newErrors.quantity = t.notEnoughStock;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddToCart = () => {
    if (!validateForm()) return;

    // Use selected variant if available, otherwise use product
    const itemId = selectedVariant?.productvariantid || selectedVariant?.ProductVariantID || product.id;
    const itemPrice = selectedVariant?.price || product.price;
    const itemImageUrl = selectedVariant?.imageurl || selectedVariant?.ImageURL || product.images[0] || '/placeholder-image.jpg';
    
    // Extract property values from selected variant or use selected options
    let variantPropertyValues: Record<string, string> = {};
    if (selectedVariant) {
      const variantProps = selectedVariant.ProductVariantPropertyvalues || selectedVariant.ProductVariantPropertyValues || [];
        variantProps.forEach((pv: any) => {
        const propName = (pv.Property?.name || pv.Property?.Name || pv.propertyid || '').toLowerCase();
          const propValue = pv.value || pv.Value || '';
          if (propName && propValue) {
            variantPropertyValues[propName] = propValue;
          }
        });
    } else {
      variantPropertyValues = selectedOptions;
    }

    // Merge base product properties with variant properties (variant takes precedence)
    const mergedPropertyValues = {
      ...product.propertyValues,
      ...variantPropertyValues,
    };

    // Get size from selected options (for backward compatibility)
    const selectedSize = selectedOptions['size'] || selectedOptions['размер'] || '';

    // Add item to cart
    addItem({
      id: itemId,
      name: `${product.brand} ${product.model}`,
      brand: product.brand,
      model: product.model,
      type: product.type,
      color: selectedOptions['colour'] || selectedOptions['color'] || product.color,
      size: selectedSize,
      price: itemPrice,
      quantity: quantity,
      imageUrl: itemImageUrl,
      category: product.category,
      propertyValues: Object.keys(mergedPropertyValues).length > 0 ? mergedPropertyValues : undefined,
    });

    // Open cart drawer
    openCart();

    // Close modal
    onClose();
  };

  const handleClose = () => {
    setSelectedOptions({});
    setQuantity(1);
    setErrors({});
    setSelectedVariant(null);
    onClose();
  };

  if (!isOpen) return null;

  // Get current quantity available
  const currentQuantity = selectedVariant?.quantity || product.quantity || 0;

  return (
    <div 
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal - Centered in the middle of the screen */}
      <div 
        className="absolute inset-0 flex items-center justify-center p-4" 
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                <Image
                  src={selectedVariant?.imageurl || selectedVariant?.ImageURL || product.images[0] || '/placeholder-image.jpg'}
                  alt={product.model}
                  fill
                  quality={90}
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {product.brand} {product.model}
                </h2>
                <p className="text-sm text-gray-600">
                  {product.type} • {product.color}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Property Selection - Dynamic for all properties */}
            {Object.keys(availableOptions).length > 0 && (
              <>
                {Object.entries(availableOptions).map(([propertyName, values]) => {
                  const propertyLabel = propertyName === 'size' ? t.size : 
                                       propertyName === 'colour' || propertyName === 'color' ? t.color :
                                       propertyName.charAt(0).toUpperCase() + propertyName.slice(1);
                  const isSelected = selectedOptions[propertyName];
                  
                  return (
                    <div key={propertyName}>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                        {propertyLabel} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                        {Array.from(values).map((value) => (
                    <button
                            key={value}
                            onClick={() => handleOptionChange(propertyName, value as string)}
                      className={`py-2 px-4 border rounded-lg text-sm font-medium transition ${
                              selectedOptions[propertyName] === value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                            {value}
                    </button>
                  ))}
                </div>
                      {errors[propertyName] && (
                        <p className="text-red-500 text-sm mt-1">{errors[propertyName]}</p>
                )}
              </div>
                  );
                })}
              </>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                {t.quantity}
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  disabled={quantity <= 1}
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  max={currentQuantity}
                  className="w-20 text-center border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  disabled={quantity >= currentQuantity}
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t.availableItems}: {currentQuantity} {t.pcs}
              </p>
              {errors.quantity && (
                <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
              )}
            </div>

            {/* Price Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  {quantity} × €{(selectedVariant?.price || product.price || 0).toFixed(2)}
                </span>
                <span className="text-lg font-bold text-gray-900">
                  €{((selectedVariant?.price || product.price || 0) * quantity).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleAddToCart}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2"
            >
              <ShoppingCart size={16} />
              <span>{t.addToCart}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddToCartModal;
