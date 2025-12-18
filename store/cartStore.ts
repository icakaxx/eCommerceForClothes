// store/cartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, CartState } from '@/types/cart';

const generateCartItemId = (id: string | number, size?: string): string => {
  return `${id}${size ? `_${size}` : ''}`;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,

      addItem: (newItem) => {
        const { items } = get();
        const cartItemId = generateCartItemId(newItem.id, newItem.size);

        // Check if item already exists (same product and size)
        const existingItemIndex = items.findIndex(item =>
          generateCartItemId(item.id, item.size) === cartItemId
        );

        if (existingItemIndex !== -1) {
          // Update quantity of existing item
          const updatedItems = [...items];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + (newItem.quantity || 1)
          };
          set({ items: updatedItems });
        } else {
          // Add new item
          const itemToAdd: CartItem = {
            ...newItem,
            quantity: newItem.quantity || 1
          };
          set({ items: [...items, itemToAdd] });
        }
      },

      removeItem: (id, size) => {
        const { items } = get();
        const filteredItems = items.filter(item =>
          !(item.id === id && item.size === size)
        );
        set({ items: filteredItems });
      },

      updateQuantity: (id, quantity, size) => {
        const { items } = get();
        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          const filteredItems = items.filter(item =>
            !(item.id === id && item.size === size)
          );
          set({ items: filteredItems });
          return;
        }

        const updatedItems = items.map(item => {
          if (item.id === id && item.size === size) {
            return { ...item, quantity };
          }
          return item;
        });
        set({ items: updatedItems });
      },

      clearCart: () => {
        set({ items: [] });
      },

      toggleCart: () => {
        set(state => ({ isCartOpen: !state.isCartOpen }));
      },

      openCart: () => {
        set({ isCartOpen: true });
      },

      closeCart: () => {
        set({ isCartOpen: false });
      },

      totalItems: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },

      totalPrice: () => {
        const { items } = get();
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
      }
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }), // Only persist items
    }
  )
);




