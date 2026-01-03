// Cart types for e-commerce store
export interface CartItem {
  id: string | number;
  name: string;
  brand: string;
  model: string;
  type?: string;
  color: string;
  size?: string;
  price: number;
  quantity: number;
  imageUrl: string;
  category: 'clothes' | 'shoes' | 'accessories';
  propertyValues?: Record<string, string>;
}

export interface CartState {
  items: CartItem[];
  isCartOpen: boolean;

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string | number, size?: string) => void;
  updateQuantity: (id: string | number, quantity: number, size?: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Computed
  totalItems: () => number;
  totalPrice: () => number;
}










