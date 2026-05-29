'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useCartStore } from '@/store/cartStore';
import { CartItem } from '@/types/cart';

interface CartContextType {
  // State
  items: CartItem[];
  isCartOpen: boolean;
  hasHydrated: boolean;
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
  const [hasHydrated, setHasHydrated] = useState(false);
  const items = useCartStore((state) => state.items);
  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const toggleCart = useCartStore((state) => state.toggleCart);
  const openCart = useCartStore((state) => state.openCart);
  const closeCart = useCartStore((state) => state.closeCart);

  useEffect(() => {
    const markHydrated = () => setHasHydrated(true);

    const unsubFinish = useCartStore.persist.onFinishHydration(markHydrated);

    if (useCartStore.persist.hasHydrated()) {
      markHydrated();
    } else {
      void useCartStore.persist.rehydrate();
    }

    return unsubFinish;
  }, []);

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce((total, item) => {
    const price = Number(item.price);
    return total + (Number.isFinite(price) ? price : 0) * item.quantity;
  }, 0);

  const value: CartContextType = {
    items,
    isCartOpen,
    hasHydrated,
    totalItems,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    openCart,
    closeCart,
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
