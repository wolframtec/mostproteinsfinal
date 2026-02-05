import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { ProductIconKey } from '../lib/product-icons';

// ============================================
// TYPES
// ============================================
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  label: string;
  iconKey: ProductIconKey;
  casNumber?: string;
  molecularWeight?: string;
  purity?: string;
  storage?: string;
  sequence?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface CartContextType {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
}

// ============================================
// CONTEXT
// ============================================
const CartContext = createContext<CartContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================
interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setItems(prev =>
      prev
        .map(i =>
          i.id === productId
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i
        )
        .filter(i => i.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const total = useMemo(() =>
    items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  const count = useMemo(() =>
    items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const value = useMemo(() => ({
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    count,
  }), [items, addItem, removeItem, updateQuantity, clearCart, total, count]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// ============================================
// HOOK
// ============================================
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
