import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { trackAddToCart } from '../api/track.api.js';

// v2: la clave pasó de productId a productId|variantId. Un carrito v1 no se
// puede reinterpretar (no sabríamos qué talla eligió), así que se descarta.
const STORAGE_KEY = 'ssa-cart-v2';
const LEGACY_KEYS = ['ssa-cart-v1'];
export const MAX_PER_ITEM = 10;

// Clave del carrito. El '|' no puede aparecer en un id de producto (son slugs de
// [a-z0-9-]) ni en un id numérico de variante, así que separa sin ambigüedad.
export const lineKey = (productId, variantId = null) => `${productId}|${variantId ?? ''}`;
export const parseLineKey = (key) => {
  const at = key.lastIndexOf('|');
  const variantId = key.slice(at + 1);
  return { productId: key.slice(0, at), variantId: variantId === '' ? null : Number(variantId) };
};

const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case 'add': {
      const current = state[action.key] ?? 0;
      return { ...state, [action.key]: Math.min(MAX_PER_ITEM, current + 1) };
    }
    case 'setQuantity': {
      if (action.quantity <= 0) {
        const next = { ...state };
        delete next[action.key];
        return next;
      }
      return { ...state, [action.key]: Math.min(MAX_PER_ITEM, action.quantity) };
    }
    case 'remove': {
      const next = { ...state };
      delete next[action.key];
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
    for (const old of LEGACY_KEYS) localStorage.removeItem(old);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (typeof stored !== 'object' || stored === null) return {};
    return Object.fromEntries(
      Object.entries(stored).filter(
        ([key, qty]) =>
          key.includes('|') && Number.isInteger(qty) && qty > 0 && qty <= MAX_PER_ITEM
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
      addItem: (productId, variantId = null) => {
        dispatch({ type: 'add', key: lineKey(productId, variantId) });
        setIsOpen(true);
        trackAddToCart();
      },
      setQuantity: (key, quantity) => dispatch({ type: 'setQuantity', key, quantity }),
      removeItem: (key) => dispatch({ type: 'remove', key }),
      clearCart: () => dispatch({ type: 'clear' }),
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false)
    }),
    [items, isOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
