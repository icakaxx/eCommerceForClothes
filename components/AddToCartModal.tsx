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

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSize(product.size || '');
      setQuantity(1);
      setErrors({});
    }
  }, [isOpen, product]);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(product.quantity, quantity + delta));
    setQuantity(newQuantity);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (product.category === 'clothes' || product.category === 'shoes') {
      if (!selectedSize) {
        newErrors.size = 'Please select a size';
      }
    }

    if (quantity > product.quantity) {
      newErrors.quantity = 'Not enough stock available';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddToCart = () => {
    if (!validateForm()) return;

    // Find the variant ID if we have a selected size
    let itemId = product.id;
    if (selectedSize && product.variants) {
      const variant = product.variants.find((v: any) => {
        // Check if variant has property values with matching size
        const sizeProperty = v.ProductVariantPropertyValues?.find((pv: any) =>
          (pv.Property?.Name?.toLowerCase() === 'size' ||
           pv.Property?.Name?.toLowerCase() === 'размер') &&
          pv.Value === selectedSize
        );
        return sizeProperty !== undefined;
      });
      if (variant) {
        itemId = variant.ProductVariantID;
      }
    }

    // Add item to cart
    addItem({
      id: itemId,
      name: `${product.brand} ${product.model}`,
      brand: product.brand,
      model: product.model,
      type: product.type,
      color: product.color,
      size: selectedSize,
      price: product.price,
      quantity: quantity,
      imageUrl: product.images[0] || '/placeholder-image.jpg',
      category: product.category,
      propertyValues: product.propertyValues,
    });

    // Open cart drawer
    openCart();

    // Close modal
    onClose();
  };

  const handleClose = () => {
    setSelectedSize('');
    setQuantity(1);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  // Available sizes based on category
  const getAvailableSizes = () => {
    if (product.category === 'clothes') {
      return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    } else if (product.category === 'shoes') {
      return ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
    }
    return [];
  };

  const availableSizes = getAvailableSizes();
  const needsSize = availableSizes.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4" onClick={handleClose}>
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                <Image
                  src={product.images[0] || '/placeholder-image.jpg'}
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
            {/* Size Selection */}
            {needsSize && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Size <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-2 px-4 border rounded-lg text-sm font-medium transition ${
                        selectedSize === size
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {errors.size && (
                  <p className="text-red-500 text-sm mt-1">{errors.size}</p>
                )}
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Quantity
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
                  max={product.quantity}
                  className="w-20 text-center border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  disabled={quantity >= product.quantity}
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Available: {product.quantity} items
              </p>
              {errors.quantity && (
                <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
              )}
            </div>

            {/* Price Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  {quantity} × ${product.price.toFixed(2)}
                </span>
                <span className="text-lg font-bold text-gray-900">
                  ${(product.price * quantity).toFixed(2)}
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
              Cancel
            </button>
            <button
              onClick={handleAddToCart}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2"
            >
              <ShoppingCart size={16} />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddToCartModal;
