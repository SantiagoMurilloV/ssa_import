import { useMemo } from 'react';
import { useCart, parseLineKey } from '../context/CartContext.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { resolveShippingFee } from '../utils/shipping.js';

// Los totales que se muestran son informativos: el precio final SIEMPRE lo
// recalcula el admin al crear el pedido.
export function useCartTotals(city) {
  const { items } = useCart();
  const { products, shipping } = useCatalog();

  return useMemo(() => {
    const lines = Object.entries(items)
      .map(([key, quantity]) => {
        const { productId, variantId } = parseLineKey(key);
        const product = products.find((p) => p.id === productId);
        if (!product) return null;
        const variant = variantId
          ? (product.variants ?? []).find((v) => v.id === variantId)
          : null;
        // La variante desapareció del catálogo (se agotó o se ocultó): la línea
        // se descarta, igual que un producto que ya no existe.
        if (variantId && !variant) return null;
        const unitPrice = variant?.price ?? product.price;
        return { key, product, variant, quantity, unitPrice, lineTotal: unitPrice * quantity };
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
