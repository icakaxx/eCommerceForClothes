'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useCartStore } from '@/store/cartStore';
import { CartItem } from '@/types/cart';

interface CartContextType {
  // State
  items: CartItem[];
  isCartOpen: boolean;
  totalItems: number;
  totalPrice: number;

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string | number, size?: string) => void;
  updateQuantity: (id: string | number, quantity: number, size?: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const cartStore = useCartStore();

  const value: CartContextType = {
    // State
    items: cartStore.items,
    isCartOpen: cartStore.isCartOpen,
    totalItems: cartStore.totalItems(),
    totalPrice: cartStore.totalPrice(),

    // Actions
    addItem: cartStore.addItem,
    removeItem: cartStore.removeItem,
    updateQuantity: cartStore.updateQuantity,
    clearCart: cartStore.clearCart,
    toggleCart: cartStore.toggleCart,
    openCart: cartStore.openCart,
    closeCart: cartStore.closeCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}








