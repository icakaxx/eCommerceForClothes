// components/CartDrawer.tsx
'use client';

import React, { useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { translations } from '@/lib/translations';
import Link from 'next/link';

const CartDrawer: React.FC = () => {
  const { language } = useLanguage();
  const {
    items,
    isCartOpen,
    totalItems,
    totalPrice,
    removeItem,
    updateQuantity,
    clearCart,
    closeCart
  } = useCart();

  const t = translations[language || 'en'];

  const formatPrice = (price: number) => {
    return `€${price.toFixed(2)}`;
  };

  // Prevent body scrolling when cart drawer is open
  useEffect(() => {
    if (isCartOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore scroll position when cart closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <ShoppingCart size={24} className="text-gray-900" />
              <h2 className="text-xl font-bold text-gray-900">{t.shoppingCart}</h2>
              {totalItems > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {totalItems}
                </span>
              )}
            </div>
            <button
              onClick={closeCart}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <ShoppingCart size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">{t.yourCartIsEmpty}</p>
                <Link
                  href="/"
                  onClick={closeCart}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {t.continueShopping}
                </Link>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {items.map((item, index) => (
                  <div key={`${item.id}-${item.size}-${index}`} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          quality={90}
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {item.brand} {item.model}
                        </h3>
                        <div className="text-sm text-gray-600 space-y-1 mt-1">
                          {/* Property Values - display all properties */}
                          {item.propertyValues && Object.keys(item.propertyValues).length > 0 ? (
                            <div className="space-y-1">
                              {Object.entries(item.propertyValues).map(([propertyName, propertyValue]) => {
                                // Format property name (capitalize first letter, replace underscores)
                                const formattedName = propertyName
                                  .replace(/_/g, ' ')
                                  .replace(/\b\w/g, l => l.toUpperCase());
                                return (
                                  <div key={propertyName}>
                                    <span className="font-medium">{formattedName}:</span> {propertyValue}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            // Fallback: show color and size if no propertyValues are available
                            <>
                              {item.color && (
                                <div>
                                  <span className="font-medium">{t.color}:</span> {item.color}
                                </div>
                              )}
                              {item.size && (
                                <div>
                                  <span className="font-medium">{t.size}:</span> {item.size}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          {formatPrice(item.price)} {t.each}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id, item.size)}
                        className="p-1 hover:bg-red-100 rounded transition"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.size)}
                          className="p-1 hover:bg-gray-200 rounded transition"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-16 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)}
                          className="p-1 hover:bg-gray-200 rounded transition"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {formatPrice(item.quantity * item.price)}
                        </p>
                        <p className="text-xs text-gray-500">{t.subtotal}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">{t.total}:</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatPrice(totalPrice)}
                </span>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={clearCart}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  {t.clearCart}
                </button>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center"
                >
                  {t.checkout}
                </Link>
              </div>

              <button
                onClick={closeCart}
                className="w-full px-4 py-2 border border-gray-900 text-gray-900 rounded-lg hover:bg-gray-900 hover:text-white transition"
              >
                {t.continueShopping}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;





