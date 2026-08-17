import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { trackAddToCart } from '../api/track.api.js';

const STORAGE_KEY = 'ssa-cart-v1';
export const MAX_PER_ITEM = 10;

const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case 'add': {
      const current = state[action.productId] ?? 0;
      return { ...state, [action.productId]: Math.min(MAX_PER_ITEM, current + 1) };
    }
    case 'setQuantity': {
      if (action.quantity <= 0) {
        const next = { ...state };
        delete next[action.productId];
        return next;
      }
      return { ...state, [action.productId]: Math.min(MAX_PER_ITEM, action.quantity) };
    }
    case 'remove': {
      const next = { ...state };
      delete next[action.productId];
      return next;
    }
    case 'clear':
      return {};
    default:
      return state;
  }
}

const loadInitial = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (typeof stored !== 'object' || stored === null) return {};
    return Object.fromEntries(
      Object.entries(stored).filter(
        ([, qty]) => Number.isInteger(qty) && qty > 0 && qty <= MAX_PER_ITEM
      )
    );
  } catch {
    return {};
  }
};

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, undefined, loadInitial);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      isOpen,
      count: Object.values(items).reduce((a, b) => a + b, 0),
      addItem: (productId) => {
        dispatch({ type: 'add', productId });
        setIsOpen(true);
        trackAddToCart();
      },
      setQuantity: (productId, quantity) => dispatch({ type: 'setQuantity', productId, quantity }),
      removeItem: (productId) => dispatch({ type: 'remove', productId }),
      clearCart: () => dispatch({ type: 'clear' }),
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false)
    }),
    [items, isOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
