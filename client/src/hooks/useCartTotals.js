import { useMemo } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { resolveShippingFee } from '../utils/shipping.js';

// Los totales que se muestran son informativos: el precio final SIEMPRE lo
// recalcula el admin al crear el pedido.
export function useCartTotals(city) {
  const { items } = useCart();
  const { products, shipping } = useCatalog();

  return useMemo(() => {
    const lines = Object.entries(items)
      .map(([productId, quantity]) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return null;
        return { product, quantity, lineTotal: product.price * quantity };
      })
      .filter(Boolean);

    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const shippingFee = city ? resolveShippingFee(city, shipping) : null;
    return {
      lines,
      subtotal,
      shippingFee,
      total: subtotal + (shippingFee ?? 0),
      isEmpty: lines.length === 0
    };
  }, [items, products, shipping, city]);
}
